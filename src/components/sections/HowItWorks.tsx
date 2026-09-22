import { Icon, type IconName } from "@/components/ui/Icon";

export const HOW_STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "rocket",
    title: "Launch",
    text: "Create your token through the platform. It enters the arena as soon as it goes live.",
  },
  {
    icon: "swords",
    title: "Compete",
    text: "Every token is ranked by one number: market cap. No votes, no curation.",
  },
  {
    icon: "trendUp",
    title: "Climb",
    text: "Volume moves market cap. The higher it goes, the closer you are to the top.",
  },
  {
    icon: "crown",
    title: "Hold the throne",
    text: "Rounds last one hour. The King of the Hill when the round closes wins it.",
  },
  {
    icon: "flame",
    title: "Buyback & burn",
    text: "Platform fees buy back the winner and burn it — reducing its circulating supply.",
  },
];

export function HowItWorks() {
  return (
    <ol className="steps">
      {HOW_STEPS.map((s, i) => (
        <li className="step card" key={s.title}>
          <div className="step-top">
            <span className="icon-tile">
              <Icon name={s.icon} />
            </span>
            <span className="step-index num">0{i + 1}</span>
          </div>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
