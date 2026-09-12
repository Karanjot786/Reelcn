import { Animate, type AnimateEffect } from "../items/animate";
import { Center, useTheme, useViewport } from "../items/core";
import type { Demo } from "./index";

const effects: AnimateEffect[] = ["fade", "up", "down", "left", "right", "scale", "pop", "blur", "zoom"];

function Tile({ label }: { label: string }) {
  const theme = useTheme();
  const { u } = useViewport();
  return (
    <div
      style={{
        width: u(230),
        height: u(150),
        borderRadius: u(theme.radius),
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        display: "grid",
        placeItems: "center",
        fontSize: u(32),
        fontWeight: 600,
        color: theme.colors.foreground,
      }}
    >
      {label}
    </div>
  );
}

function AnimateGrid() {
  const { u } = useViewport();
  return (
    <Center>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: u(26), maxWidth: u(900) }}>
        {effects.map((effect, index) => (
          <Animate key={effect} effect={effect} delay={index * 3}>
            <Tile label={effect} />
          </Animate>
        ))}
      </div>
    </Center>
  );
}

export default [{ id: "animate", duration: 75, component: AnimateGrid }] satisfies Demo[];
