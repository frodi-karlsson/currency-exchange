import lume from "https://deno.land/x/lume@v3.2.2/mod.ts";

const site = lume({
  src: "./src",
  dest: "./_site",
});

export default site;