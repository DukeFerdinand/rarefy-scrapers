module.exports = {
    esbuild: {
        minify: false,
        platform: "node",
        allowOverwrite: true
    },
    prebuild: async () => {
        console.log("prebuild");
        const rimraf = (await import("rimraf")).default;
        rimraf.sync("./dist"); // clean up dist folder
    },
}