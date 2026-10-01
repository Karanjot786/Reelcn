// The reelcn launch film on Editframe. Editframe owns the clock; the GSAP timeline is seeked from a frame task,
// the composition skill's documented way to use an animation library.
import "@editframe/elements";
import "@editframe/elements/styles.css";
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
    timeline ??= build(root);
    timeline.seek(ownCurrentTime, false);
  });
};
