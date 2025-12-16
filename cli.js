#!/usr/bin/env node

import { processMarkdown } from "./index.js"
import caporal from "@caporal/core"
import { readFile } from "fs/promises"

const { program } = caporal

program
  .argument("<filepath>", "Path to a markdown file.")
  .action(async ({ logger, args }) => {
    logger.info("Reading file.")
    const file = (await readFile(args.filepath)).toString()
    processMarkdown(file, logger)
})

program.run()

/* const { options, processedArgs } = program.parse() */

/* console.log({ options, processedArgs }) */



