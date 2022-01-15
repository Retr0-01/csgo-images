const Jimp = require("jimp");
const got = require("got").default;

(async () => {
	// Get a list of maps
	let mapsList = await getURL("https://api.github.com/repos/SteamDatabase/GameTracking-CSGO/contents/csgo/pak01_dir/materials/panorama/images/map_icons/screenshots/1080p", true);

	mapsList = mapsList.map((map) => {
		let parts = map.name.split(".");
		parts.pop();

		return {
			name: parts.join("."),
			url: map.download_url
		};
	});
	console.log("Found " + mapsList.length + " maps");

	// Process all the maps
	for (let i = 0; i < mapsList.length; i++) {
		console.log("Processing " + mapsList[i].name + " (" + (i + 1) + "/" + mapsList.length + ")");

		let buffer = await getURL(mapsList[i].url, false, true);
		let img = await Jimp.read(buffer);

		// Force all images to be 1024 x 1024
		let curAspectW = img.bitmap.width / img.bitmap.height;
		let newHeight = 1024;
		let newWidth = Math.round(newHeight * curAspectW);
		let cropWidth = Math.round((newWidth - 1024) / 2);

		img.resize(newWidth, newHeight);
		img.crop(cropWidth, 0, 1024, 1024);
		img.write(`./maps/${mapsList[i].name}.png`);
	}

	console.log("Done!");
})();


async function getURL(url, isJSON = true, isBuffer = false) {
	let req = await got(url);
	if ((req.statusCode - 200) >= 100) {
		// Any 200 is "success"
		throw req.statusCode;
	}

	if (isBuffer) {
		return req.rawBody;
	}

	if (!isJSON) {
		return req.body;
	}

	try {
		let json = JSON.parse(req.body);
		return json;
	} catch {
		throw req.body;
	}
}