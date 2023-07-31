/** @type {import('next').NextConfig} */

// const withOptimizedImages = require("next-optimized-images");

// module.exports = withOptimizedImages({
//   /* config for next-optimized-images */

//   // your config for other plugins or the general next.js here...

//   output: "export",
//   images: {
//     disableStaticImages: true,
//     unoptimized: true,
//   },
// });

const withOptimisedImages = require("@hashicorp/next-optimized-images");

module.exports = withOptimisedImages({
  output: "export",
  images: {
    disableStaticImages: true,
    unoptimized: true,
    path: "/MotoGP-Random-Rider-Selector/",
  },
  // sassOptions: {
  //   includePaths: [path.join(__dirname, "styles")],
  // },

  basePath: "/MotoGP-Random-Rider-Selector",
  assetPrefix: "/MotoGP-Random-Rider-Selector",

  responsive: {
    adapter: require("responsive-loader/sharp"),
  },
});
