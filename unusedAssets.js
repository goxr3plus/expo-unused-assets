/*
 * GOXR3PLUS STUDIO
 * Description: Identify and handle unused assets in a project
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { parse } = require('@babel/parser');

// Global parameter to control folder name console log
const showFolderNames = false;

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
			if (showFolderNames) {
				console.log('Checking folder:', entryPath);
			}
			files = await collectFiles(entryPath, fileExtensions, files); // Recursively collect files in subdirectories
		} else if (stats.isFile() && fileExtensions.includes(path.extname(entryPath))) {
			files.push(entryPath); // Add the file path to the files array
		}
	}

	return files;
}

/**
 * Analyze code and extract import/require statements and asset references
 * @param {string} code - The code to analyze
 * @param {string} srcFilePath - The file path of the analyzed code
 * @returns {string[]} - Array of import/require statements and asset references
 */
function analyzeCodebase(code, srcFilePath) {
	const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
	const requireRegex = /require\s*\(['"](.*?)['"]\)/g;
	const assetRegex = /(['"])(?:\\.|[^\\])*?\.(png|jpg|jpeg|gif)(['"])/g;
	const imports = new Set();
	const assets = new Set();

	let match;
	while ((match = importRegex.exec(code)) !== null) {
		const importString = match[1];
		imports.add(importString);
	}

	while ((match = requireRegex.exec(code)) !== null) {
		const importString = match[1];
		imports.add(importString);
	}

	while ((match = assetRegex.exec(code)) !== null) {
		const assetString = match[0];
		const assetPath = path.resolve(path.dirname(srcFilePath), assetString.slice(1, -1));
		assets.add(assetPath);
	}

	return [...imports, ...assets];
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
/**
 * Identify and handle unused assets
 * @param {string} projectDirectory - The project directory
 * @returns {Promise<void>} - Promise that resolves when the process is complete
 */
async function identifyUnusedAssets(projectDirectory) {
	console.log(`Project Directory: ${projectDirectory}`);

	console.log('Scanning project files...');
	const srcFiles = await collectFiles(path.join(projectDirectory, 'src'), ['.js', '.jsx', '.tsx']);
	const assetFolders = await collectFiles(path.join(projectDirectory, 'assets'), ['.png', '.jpg', '.jpeg', '.gif', '.json']);

	const usedAssets = new Set();
	const unusedAssets = [];

	let progress = 0;
	const totalFiles = srcFiles.length;
	console.log('Analyzing code files...');
	for (const srcFile of srcFiles) {
		const code = await fs.readFile(srcFile, 'utf-8');
		const references = analyzeCodebase(code, srcFile);

		references.forEach((reference) => {
			const assetPath = path.resolve(path.dirname(srcFile), reference);
			usedAssets.add(assetPath);
		});

		progress++;
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`Processed ${progress} of ${totalFiles} code files.`);
	}

	console.log('\nUnused Assets:');
	const excludedFiles = ['adaptive-icon.png', 'icon.png', 'splash.png'];
	unusedAssets.push(
		...assetFolders
			.filter((assetFile) => !usedAssets.has(assetFile))
			.filter((assetFile) => !excludedFiles.includes(path.basename(assetFile)))
	);
	console.log(unusedAssets);

	if (unusedAssets.length === 0) {
		console.log('No unused assets found.');
		return;
	}

	let totalSize = 0;
	for (const assetFile of unusedAssets) {
		const stats = await fs.lstat(assetFile);
		totalSize += stats.size;
	}
	const totalSizeMB = totalSize / (1024 * 1024); // Convert bytes to megabytes

	console.log(`Total size of unused files: ${totalSizeMB.toFixed(2)} MB`);

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
