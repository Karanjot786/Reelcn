// The reelcn launch film on Editframe. Editframe owns the clock; the GSAP timeline is seeked from a frame task,
// the composition skill's documented way to use an animation library.
import "@editframe/elements";
import "@editframe/elements/styles.css";
import gsap from "gsap";
import { build, CSS, MARKUP } from "./film.js";

const style = document.createElement("style");
style.textContent = CSS.replaceAll('url("assets/', 'url("./src/assets/');
document.head.append(style);

const film = document.getElementById("film");
film.initializer = (timegroup) => {
  const root = timegroup.querySelector("#root");
  if (root.children.length === 0) root.innerHTML = MARKUP.replaceAll('"assets/', '"./src/assets/');
  let timeline = null;
  timegroup.addFrameTask(({ ownCurrentTime }) => {
    if (!timeline) {
      // Render clones hold a second copy of the film: scope every selector to this clone's root.
      gsap.context(() => {
        timeline = build(root);
      }, root);
      // build() creates the tiles with relative image paths; point them at the asset folder.
      for (const img of root.querySelectorAll('img[src^="assets/"]')) img.src = `./src/${img.getAttribute("src")}`;
    }
    timeline.seek(ownCurrentTime, false);
  });
};
