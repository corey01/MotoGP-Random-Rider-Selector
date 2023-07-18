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

const nextConfig = {
  output: "export",
  images: {
    disableStaticImages: true,
    unoptimized: true,
    path: "/MotoGP-Random-Rider-Selector/",
    responsive: {
      adapter: require("responsive-loader/sharp"),
    },
  },

  basePath: "/MotoGP-Random-Rider-Selector",
  assetPrefix: "/MotoGP-Random-Rider-Selector",
};

module.exports = withOptimisedImages({
  ...nextConfig,
  // responsive: {
  //   adapter: require("responsive-loader/sharp"),
  //   sizes: [320, 640, 960, 1200, 1800, 2400],
  //   placeholder: true,
  //   placeholderSize: 20,
  // },
});
