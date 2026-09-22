"use client";

/**
 * Single wallet layer for the app, built on the injected EIP-1193 provider.
 * Read-only: it connects and tracks account/chain. It never signs anything on
 * its own — signing only happens inside explicit user flows (see lib/launch.ts).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EXPECTED_CHAIN_ID, EXPLORER_URL, NETWORK_NAME, RPC_URL } from "@/lib/config";
import { getInjectedProvider, type Eip1193Provider } from "./eip1193";

type WalletStatus = "unavailable" | "disconnected" | "connecting" | "connected";

interface WalletState {
  status: WalletStatus;
  address: `0x${string}` | null;
  chainId: number | null;
  /** True when a chain is configured and the wallet is on another one. */
  wrongNetwork: boolean;
  error: string | null;
  provider: Eip1193Provider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Asks the wallet to switch to the expected chain, adding it if unknown. */
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

const STORAGE_KEY = "peak.wallet.autoconnect";

function readFlag() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [ready, setReady] = useState(false);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect the injected provider after mount (never during SSR).
  useEffect(() => {
    const p = getInjectedProvider();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client detection
    setProvider(p);
    setReady(true);
    if (!p || !readFlag()) return;
    // Silent reconnect: eth_accounts does not prompt.
    p.request({ method: "eth_accounts" })
      .then((accounts) => {
        const first = (accounts as string[])[0];
        if (first) setAddress(first as `0x${string}`);
      })
      .catch(() => {});
    p.request({ method: "eth_chainId" })
      .then((id) => setChainId(parseInt(id as string, 16)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!provider?.on) return;
    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress((accounts[0] as `0x${string}`) ?? null);
      if (!accounts[0]) writeFlag(false);
    };
    const onChain = (...args: unknown[]) => setChainId(parseInt(args[0] as string, 16));
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) {
      setError("No wallet found. Install a browser wallet to continue.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      const id = (await provider.request({ method: "eth_chainId" })) as string;
      setAddress((accounts[0] as `0x${string}`) ?? null);
      setChainId(parseInt(id, 16));
      writeFlag(true);
    } catch (e) {
      const code = (e as { code?: number }).code;
      setError(code === 4001 ? "Connection request was rejected." : "Could not connect wallet.");
    } finally {
      setConnecting(false);
    }
  }, [provider]);

  const switchNetwork = useCallback(async () => {
    if (!provider) return;
    const chainId = `0x${EXPECTED_CHAIN_ID.toString(16)}`;
    setError(null);
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
    } catch (e) {
      const code = (e as { code?: number }).code;
      if (code === 4001) return;
      // 4902: chain not added to the wallet yet.
      if (code !== 4902) {
        setError(`Could not switch to ${NETWORK_NAME}.`);
        return;
      }
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId,
              chainName: NETWORK_NAME,
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: [EXPLORER_URL],
            },
          ],
        });
      } catch (addError) {
        if ((addError as { code?: number }).code !== 4001) {
          setError(`Could not add ${NETWORK_NAME} to your wallet.`);
        }
      }
    }
  }, [provider]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
    writeFlag(false);
  }, []);

  const value = useMemo<WalletState>(() => {
    const status: WalletStatus = !ready
      ? "disconnected"
      : !provider
        ? "unavailable"
        : connecting
          ? "connecting"
          : address
            ? "connected"
            : "disconnected";
    return {
      status,
      address,
      chainId,
      wrongNetwork: status === "connected" && chainId !== null && chainId !== EXPECTED_CHAIN_ID,
      error,
      provider,
      connect,
      disconnect,
      switchNetwork,
    };
  }, [ready, provider, connecting, address, chainId, error, connect, disconnect, switchNetwork]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
