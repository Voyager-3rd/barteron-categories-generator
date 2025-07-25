const inputParams = {
	id: 6000,
	isNew: false,
	order: 3000,
	icon: "fa-car",
	shift: "****",
};

var existing = null;

const fs = require('fs');

const
	keyFileName = "en-US",
	fileNames = [
		"en-US",
		"ru-RU",
		"sr-RS",
	];

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

	existing = {
		data: JSON.parse(fs.readFileSync('./input/existing/data/categories.json', 'utf8')),
		i18n: JSON.parse(fs.readFileSync('./input/existing/i18n/categories.json', 'utf8')),
	};

	if (inputParams.isNew && existing?.data?.[inputParams.id]) {
		throw new Error(`inputParams.id = ${inputParams.id} - already exists in source file`);
	} else if (!(inputParams.isNew) && !(existing?.data?.[inputParams.id])) {
		throw new Error(`inputParams.id = ${inputParams.id} - must be exists in source file`);
	};

	const files = {};
	fileNames.forEach(m => {
		const text = fs.readFileSync(`./input/${m}.txt`, 'utf8');
		files[m] = text
			.split(/\r?\n/)
			.map(m => m.trim())
			.filter(f => f.length);
	});

	const 
		keyFileRows = files[keyFileName],
		i18nKeys = keyFileRows
			.map(m => m
				.toLowerCase()
				.replaceAll(/\s*,\s*/g, "_")
				.replaceAll(/\s+/g, "_")
				.replaceAll("****", "")
			);
	
	const i18nData = {};
	fileNames.forEach(fileName => {
		const 
			fileRows = files[fileName],
			currentData = {};

		i18nKeys.forEach((key, index) => {
			currentData[key] = fileRows[index].replaceAll("****","");
		});

		i18nData[fileName] = JSON.stringify(currentData, null, "\t");
	});

	fileNames.forEach(m => {
		fs.writeFileSync(`./output/${m}.json`, i18nData[m]);
	});

	const categories = {};
	let id = inputParams.id;
	const 
		parentByShift = {},
		orderByShift = {};

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
				parent: null,
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

	fs.writeFileSync(`./output/categories.json`, JSON.stringify(categories, null, "\t"));

	console.log("✅ SUCCESS!");
	
} catch (error) {
	console.error("❌ FAILED!", error);
}