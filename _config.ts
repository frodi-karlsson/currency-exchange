import lume from "https://deno.land/x/lume@v3.2.2/mod.ts";
import esbuild from "https://deno.land/x/lume@v3.2.2/plugins/esbuild.ts";
import lightningcss from "https://deno.land/x/lume@v3.2.2/plugins/lightningcss.ts";

const site = lume({
  src: "./src",
  dest: "./_site",
});

// JSX support will be handled by esbuild with automatic runtime
site.use(esbuild({
  extensions: [".ts", ".tsx", ".jsx"],
  options: {
    jsx: "automatic",
    jsxImportSource: "npm:react",
    bundle: true,
  },
}));

site.use(lightningcss());

// Copy static assets
site.copy("styles");

export default site;