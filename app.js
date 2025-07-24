const inputParams = {
	id: 6000,
	order: 3000,
	icon: "fa-car",
};

const fs = require('fs');

const
	keyFileName = "en-US",
	fileNames = [
		"en-US",
		"ru-RU",
		"sr-RS",
	];

try {

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

	// console.log(i18nData);

} catch (error) {
	console.error(error);
}