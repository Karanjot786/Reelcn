import Link from "next/link";
import { FilmStrip } from "@/components/film-strip";
import "./not-found.css";

// Blank leader: four unexposed frames, the third circled.
const leader = [{}, {}, {}, {}];

export default function NotFound() {
  return (
    <main className="landing lost">
      <FilmStrip frames={leader} mark={2} note="frame missing" />
      <h1>Page not found</h1>
      <p>Nothing is at this address. Check the link, or start again from the home page.</p>
      <Link className="button" href="/">
        Go to the home page
      </Link>
    </main>
  );
}
