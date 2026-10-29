import { HeroEditor } from "./HeroEditor";
import { FeaturedListEditor } from "./FeaturedListEditor";
import { ShortsEditor } from "./ShortsEditor";
import { FeaturedNewsEditor } from "./FeaturedNewsEditor";

export default function HomeManager() {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / CONTENT</div>
          <h1>Home page manager</h1>
          <p>Make a great first impression.</p>
        </div>
      </div>
      <div className="home-editor-layout">
        <section className="settings-form">
          <h2 className="mb-5">Hero banner</h2>
          <HeroEditor />
        </section>
        <section className="settings-form">
          <h2 className="mb-5">Things You Might Like</h2>
          <FeaturedListEditor />
        </section>
        <section className="settings-form">
          <h2 className="mb-5">Shorts &amp; Entertainment</h2>
          <ShortsEditor />
        </section>
        <section className="settings-form">
          <h2 className="mb-5">Featured News</h2>
          <FeaturedNewsEditor />
        </section>
      </div>
    </>
  );
}

