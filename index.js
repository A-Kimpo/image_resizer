import fsp from "node:fs/promises";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "readline";
import sharp from "sharp";

import checkPerformance, { functionRuns } from "./checkPerformance.js";

const rl = readline.createInterface({ input, output });
const getAbsolutePath = (filepath) => path.resolve(process.cwd(), filepath);
const getExtName = (filepath) => path.extname(filepath);
const isDirectory = async (path) => (await fsp.stat(path)).isDirectory();
const readDir = async (filepath) =>
  await fsp.readdir(getAbsolutePath(filepath), "utf-8");

const normalizeFileName = (name) => {
  const string = name
    .toLocaleLowerCase()
    .replace("+2", "2")
    .replace(/\W|_/gi, " ");

  const plotFind = string.match(/plot.\d+|plot\d+|\d+plot/g);
  const plotNum = string.match(/ \d+ /g)?.join("").trim();
  const plotWithNum = plotNum ? `plot_${plotNum}` : "plot_0";
  const plotRes = plotFind ? plotFind.join("").replace(" ", "_") : plotWithNum;
  const plot = plotRes.includes("_") ? plotRes : `plot_${plotRes.slice(4)}`;

  return {
    type:
      string
        .match(/\dbr2|\dbr/g)
        .join("")
        .toUpperCase() ?? string,
    lvl: string.includes("gold")
      ? "gold"
      : string.includes("silver")
      ? "silver"
      : string.includes("platinum") || string.includes("pl")
      ? "platinum"
      : "",
    pod: !string.match(/no.pod|nopod|witht.pod/g),
    color: string.includes("warm") ? "warm" : "cold",
    plot,
    floor:
      string.match(/ff|gf|1f|2f/g).join("") === "ff"
        ? "1F"
        : string
            .match(/ff|gf|1f|2f/g)
            ?.join("")
            .toUpperCase(),
  };
};

// const resizeImage = async (pathToElement, outputPath) =>
//     await sharp(pathToElement)
//       .png({ palette: true, quality: 85 })
//       .toFile(outputPath);

const workWithPng = async (pathToElement, resultPath, duplicatesPath) => {
  try {
    await fsp
      .cp(pathToElement, resultPath, {
        recursive: true,
        force: false,
        errorOnExist: true,
      })
      .then(() => console.log(`Wrote: ${resultPath}`));

    // await fsp.access(resultPath, fsp.constants.R_OK);
    // await fsp.copyFile(pathToElement, duplicatesPath);
    // await checkPerformance(resizeImage)(pathToElement, duplicatesPath, (err => console.log(err)))
    //     .then(() => console.log(`Wrote duplicate: ${duplicatesPath}`));
  } catch (er) {
    // console.log(er.code)

    await fsp
      .cp(pathToElement, duplicatesPath, { recursive: true })
      .then(() => console.log(`Wrote duplicate: ${duplicatesPath}`));

    // await fsp.copyFile(pathToElement, resultPath)
    // await resizeImage(pathToElement, resultPath)
    //     .then(() => console.log(`Wrote: ${resultPath}`));
  }
};

const copyPngsInUnionFolder = async (dirPath) => {
  const dirs = await readDir(dirPath);

  for (const elem of dirs) {
    const pathToElement = path.join(dirPath, elem);

    if (await isDirectory(pathToElement))
      await copyPngsInUnionFolder(pathToElement);

    if (getExtName(elem) === ".png") {
      try {
        await fsp.cp(pathToElement, `./union/${elem}`, {
          recursive: true,
          force: false,
          errorOnExist: true,
        });
      } catch (er) {
        console.log(er.code);
      }
    }
  }
};

const renameFPs = async (dirPath) => {
  await fsp.rm(`./union`, { recursive: true, force: true });

  await checkPerformance(copyPngsInUnionFolder)(dirPath);

  console.log(
    'Please press "Enter", when tiny-png complete and you replace all file in union folder...'
  );

  await rl.on("line", async () => {
    const pngs = await readDir(`./union`);

    for (const pngName of pngs) {
      const { type, lvl, pod, color, plot, floor } = normalizeFileName(pngName);

      const pathToElement = path.join(`./union`, pngName);
      const resultPath = `./result/${lvl}/${color}/${
        pod ? "wp" : "wop"
      }/${type}_${floor}_${plot}.png`;
      const duplicatesPath = `./result_duplicates/${resultPath
        .replace(/\//g, "_")
        .slice(2, resultPath.length)}`;

      await checkPerformance(workWithPng)(
        pathToElement,
        resultPath,
        duplicatesPath
      );
    }

    console.table(functionRuns);
    rl.close();
  });
};
export default renameFPs;
