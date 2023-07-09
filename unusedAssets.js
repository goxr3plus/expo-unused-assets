/*
 * GOXR3PLUS STUDIO
 * https://goxr3plus.com
 * Description: Identify and handle unused assets in a project
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { parse } = require('@babel/parser');

/**
 * Recursively collect files with specified extensions in a directory
 * @param {string} directory - The directory to search for files
 * @param {string[]} fileExtensions - Array of file extensions to include
 * @param {string[]} [files=[]] - Array to store the collected file paths
 * @returns {Promise<string[]>} - Promise that resolves to an array of file paths
 */
async function collectFiles(directory, fileExtensions, files = []) {
	const entries = await fs.readdir(directory);

	for (const entry of entries) {
		const entryPath = path.join(directory, entry);
		const stats = await fs.lstat(entryPath);

		if (stats.isDirectory()) {
			await collectFiles(entryPath, fileExtensions, files); // Recursively collect files in subdirectories
		} else if (stats.isFile() && fileExtensions.includes(path.extname(entryPath))) {
			files.push(entryPath); // Add the file path to the files array
		}
	}

	return files;
}

/**
 * Analyze code and extract import/require statements
 * @param {string} code - The code to analyze
 * @returns {string[]} - Array of import/require statements
 */
function analyzeCodebase(code) {
	const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
	const requireRegex = /require\s*\(['"](.*?)['"]\)/g;
	const imports = new Set();

	let match;
	while ((match = importRegex.exec(code)) !== null) {
		const importString = match[1];
		imports.add(importString);
	}

	while ((match = requireRegex.exec(code)) !== null) {
		const importString = match[1];
		imports.add(importString);
	}

	return Array.from(imports);
}

/**
 * Copy a file from source to destination
 * @param {string} source - The source file path
 * @param {string} destination - The destination file path
 * @returns {Promise<void>} - Promise that resolves when the file is copied
 */
async function copyFile(source, destination) {
	try {
		await fs.copyFile(source, destination);
	} catch (error) {
		console.error(`Error copying file: ${error}`);
	}
}

/**
 * Identify and handle unused assets
 * @param {string} projectDirectory - The project directory
 * @returns {Promise<void>} - Promise that resolves when the process is complete
 */
async function identifyUnusedAssets(projectDirectory) {
	console.log(`Project Directory: ${projectDirectory}`);

	console.log('Scanning project files...');
	const srcFiles = await collectFiles(path.join(projectDirectory, 'src'), ['.js', '.jsx']);
	const assetFiles = await collectFiles(path.join(projectDirectory, 'assets'), ['.png', '.jpg', '.jpeg', '.gif']);
	const lottieFiles = await collectFiles(path.join(projectDirectory, 'assets', 'lottie'), ['.json']);

	const usedAssets = new Set();

	let progress = 0;
	console.log('Analyzing code files...');
	for (const srcFile of srcFiles) {
		const code = await fs.readFile(srcFile, 'utf-8');
		const imports = analyzeCodebase(code);

		imports.forEach((importString) => {
			const assetName = path.basename(importString);
			usedAssets.add(assetName);
		});

		progress++;
		console.log(`Processed ${progress} of ${srcFiles.length} code files.`);
	}

	console.log('Unused Assets:');
	const excludedFiles = ['adaptive-icon.png', 'icon.png', 'splash.png'];
	const unusedAssets = assetFiles
		.concat(lottieFiles)
		.filter((assetFile) => !usedAssets.has(path.basename(assetFile)))
		.filter((assetFile) => !excludedFiles.includes(path.basename(assetFile)));
	console.log(unusedAssets);

	if (unusedAssets.length === 0) {
		console.log('No unused assets found.');
		return;
	}

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.question('Do you want to delete the original files? (Y/N) ', async (answer) => {
		if (answer.toLowerCase() === 'y') {
			rl.question('Are you sure you want to delete the original files? (Y/N) ', async (confirmation) => {
				if (confirmation.toLowerCase() === 'y') {
					for (const assetFile of unusedAssets) {
						await fs.unlink(assetFile); // Delete individual asset files
						console.log(`Deleted ${assetFile}`);
					}
				}
				rl.close();
			});
		} else {
			rl.close();
		}
	});
}

// Usage
identifyUnusedAssets(__dirname);
