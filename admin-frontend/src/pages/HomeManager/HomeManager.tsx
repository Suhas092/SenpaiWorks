import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { HERO_PATH, HeroEditor, type HeroSlide } from "./HeroEditor";
import { FeaturedListEditor } from "./FeaturedListEditor";
import { mediaUrl, sortByOrder } from "./shared";

const TABS = ["Hero banner", "Things You Might Like"] as const;

export default function HomeManager() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Hero banner");
  const slides = useFetch<HeroSlide[]>(HERO_PATH);
  // The first visible banner by display order is what the home page shows.
  const hero = Array.isArray(slides.data)
    ? sortByOrder(slides.data).find((slide) => slide.published)
    : undefined;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / CONTENT</div>
          <h1>Home page manager</h1>
          <p>Make a great first impression.</p>
        </div>
      </div>
      <div className="page-tabs">
        {TABS.map((t) => (
          <Button variant={t === tab ? "secondary" : "ghost"} key={t} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>
      <div className="home-editor-layout">
        <section className="settings-form">
          <h2 className="mb-5">{tab}</h2>
          {tab === "Hero banner" ? <HeroEditor /> : <FeaturedListEditor />}
        </section>
        <section>
          <span className="field-label mb-3">Live on home page</span>
          {hero?.bgUrl ? (
            hero.bgType === "video" ? (
              <video
                src={mediaUrl(hero.bgUrl)}
                className="rounded-lg w-full"
                muted
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img src={mediaUrl(hero.bgUrl)} alt={hero.title} className="rounded-lg w-full" />
            )
          ) : (
            <p className="text-sm text-muted-foreground">No visible hero banner.</p>
          )}
          {hero && <p className="text-xs text-muted-foreground mt-3">{hero.title}</p>}
        </section>
      </div>
    </>
  );
}

