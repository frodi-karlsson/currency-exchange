import lume from "https://deno.land/x/lume@v3.2.2/mod.ts";
import esbuild from "https://deno.land/x/lume@v3.2.2/plugins/esbuild.ts";
import lightningcss from "https://deno.land/x/lume@v3.2.2/plugins/lightningcss.ts";

const site = lume({
  src: "./",
  dest: "./_site",
});

site.use(esbuild({
  extensions: [".ts", ".tsx", ".jsx"],
  options: {
    jsx: "automatic",
    jsxImportSource: "react",
    bundle: true,
  },
}));

site.use(lightningcss());

site.copy("src/styles");

site.add("js/main.tsx");

export default site;
