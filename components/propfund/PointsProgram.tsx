"use client";

import { type CSSProperties, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";

const pointStages = [
  {
    id: "week",
    label: "Trading week",
    icon: "schedule",
    title: "Complete the week.",
    copy: "Finish an eligible trading week and collect Propfund Points.",
    progress: 32,
    marker: "Points added",
    balance: "1,240",
    delta: "+250",
    next: "260 to next box",
  },
  {
    id: "box",
    label: "Mystery box",
    icon: "flag",
    title: "Reach a milestone.",
    copy: "Keep collecting points. At set intervals, a mystery box becomes available.",
    progress: 66,
    marker: "Box unlocked",
    balance: "1,500",
    delta: "Ready",
    next: "Open mystery box",
  },
  {
    id: "streak",
    label: "Trading streak",
    icon: "trending_up",
    title: "Keep the rhythm.",
    copy: "Consistent trading weeks move your points balance and unlock more program perks.",
    progress: 100,
    marker: "Next tier",
    balance: "2,500",
    delta: "6 weeks",
    next: "500 to next tier",
  },
] as const;

export function PointsProgram() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = pointStages[activeIndex];

  return (
    <section className="points-program" id="points">
      <div className="points-program-copy">
        <span className="points-kicker">Propfund Points</span>
        <h2>Trade the week.<br />Stack the points.</h2>
        <p>Every eligible week earns points. Keep the rhythm, hit milestones, and unlock mystery boxes as you go.</p>
        <div className="points-tabs" role="tablist" aria-label="How Propfund Points work">
          {pointStages.map((stage, index) => (
            <button
              aria-selected={activeIndex === index}
              className={activeIndex === index ? "active" : ""}
              key={stage.id}
              onClick={() => setActiveIndex(index)}
              role="tab"
              type="button"
            >
              <MaterialIcon name={stage.icon} />
              <span>{stage.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="points-visual" aria-live="polite">
        <div className="points-visual-top">
          <span><i /> Points program</span>
          <strong>{active.balance} <small>PTS</small></strong>
        </div>
        <div className="points-orbit" data-stage={active.id}>
          <div className="points-orbit-ring ring-one" />
          <div className="points-orbit-ring ring-two" />
          <div className="points-orbit-core"><MaterialIcon name={active.icon} /></div>
          <span className="points-orbit-chip"><MaterialIcon name="flag" />{active.marker}</span>
        </div>
        <div className="points-metrics">
          <div><span>This stage</span><strong>{active.delta}</strong></div>
          <div><span>Points balance</span><strong>{active.balance}</strong></div>
          <div><span>Up next</span><strong>{active.next}</strong></div>
        </div>
        <div className="points-progress" style={{ "--points-progress": `${active.progress}%` } as CSSProperties}>
          <span><i /></span>
          <div>
            {pointStages.map((stage, index) => <i className={index <= activeIndex ? "active" : ""} key={stage.id} />)}
          </div>
        </div>
        <div className="points-visual-copy" key={active.id}>
          <h3>{active.title}</h3>
          <p>{active.copy}</p>
        </div>
      </div>
    </section>
  );
}