const inputParams = {
	id: 5000,
	parent: null,
	isNew: true,
	order: 342,
	icon: "fa-heartbeat",
	shift: "****",
	keyFileName: "en-US",
	fileNames: [
		"en-US",
		"ru-RU",
		"sr-RS",
	], 
};

var existing = null;

const fs = require('fs');

function getShift(row) {
	let result = 0;
	while (row.startsWith(inputParams.shift)) {
		row = row.replace(inputParams.shift, "");
		result++;
	};
	return result;
};

function getNextId(id) {
	id++;
	while (existing?.data?.[id]) {
		id++;
	};
	return id;
};

try {

	// get existing categories data
	existing = {
		data: JSON.parse(fs.readFileSync('./input/existing/data/categories.json', 'utf8')),
		i18n: JSON.parse(fs.readFileSync('./input/existing/i18n/categories.json', 'utf8')),
	};

	// check input id
	if (inputParams.isNew && existing?.data?.[inputParams.id]) {
		throw new Error(`inputParams.id = ${inputParams.id} - already exists in source file`);
	} else if (!(inputParams.isNew) && !(existing?.data?.[inputParams.id])) {
		throw new Error(`inputParams.id = ${inputParams.id} - must be exists in source file`);
	};

	// read input raw files to create new categories
	const files = {};
	inputParams.fileNames.forEach(m => {
		const text = fs.readFileSync(`./input/${m}.txt`, 'utf8');
		files[m] = text
			.split(/\r?\n/)
			.map(m => m.trim())
			.filter(f => f.length);
	});

	// creating i18n keys of categories from input key file
	const 
		keyFileRows = files[inputParams.keyFileName],
		i18nKeys = keyFileRows
			.map(m => m
				.toLowerCase()
				.replaceAll(/\s*,\s*/g, "_")
				.replaceAll("(", "")
				.replaceAll(")", "")
				.replaceAll("'", "")
				.replaceAll(/\s+/g, "_")
				.replaceAll("****", "")
			);
	
	// creating i18n files for categories
	const i18nData = {};
	inputParams.fileNames.forEach(fileName => {
		const 
			fileRows = files[fileName],
			currentData = {};

		// getting i18n values
		i18nKeys.forEach((key, index) => {
			currentData[key] = fileRows[index].replaceAll("****","");
		});

		// checking for i18n keys unique
		i18nKeys.forEach((key, index) => {
			if (existing.i18n?.[key] && currentData[key]) {
				console.warn(`⚠️ ${fileName}, Duplicated key removed: "${key}"; Current value: "${currentData[key]}"${ (fileName === inputParams.keyFileName) ? ", Existing value: \"" + existing.i18n?.[key] + "\"" : "" }`);
				delete currentData[key];
			};
		});

		// convert to JSON
		i18nData[fileName] = JSON.stringify(currentData, null, "\t");
	});

	// writing i18n files
	inputParams.fileNames.forEach(m => {
		fs.writeFileSync(`./output/${m}.json`, i18nData[m]);
	});

	// creating categories file
	//
	const categories = {};
	let id = inputParams.id;
	const 
		parentByShift = {},
		orderByShift = {};

	// getting data from source file to create categories with children if they exist
	for (let index = 0; index < keyFileRows.length; index++) {
		const 
			row = keyFileRows[index],
			shift = getShift(row),
			name = i18nKeys[index];
		
		if (shift === 0) {
			const item = {
				name,
				icon: inputParams.icon,
				id,
				parent:  inputParams.parent,
				children: [],
				order: inputParams.order,
			};

			categories[id] = item;
			parentByShift[shift] = item;
			orderByShift[shift + 1] = 0;
		} else {
			id = getNextId(id);
			orderByShift[shift] = orderByShift[shift] + 10;
			orderByShift[shift + 1] = 0;

			const item = {
				name,
				id,
				parent: parentByShift[shift - 1].id,
				children: [],
				order: orderByShift[shift],
			};

			categories[id] = item;
			parentByShift[shift] = item;
			parentByShift[shift - 1].children.push(id);
		}
		
	};

	// writing categories
	fs.writeFileSync(`./output/categories.json`, JSON.stringify(categories, null, "\t"));

	console.log("✅ SUCCESS!");
	
} catch (error) {
	console.error("❌ FAILED!", error);
}