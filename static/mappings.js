function eh(){
	let territories = [
	{
		"continent": "Africa",
		"countries": [
			"Egypt",
			"Algeria",
			"Nigeria",
			"Morocco",
			"Senegal",
			"Tunisia",
			"South Africa",
			"Cameroon",
			"Togo",
			"Ethiopia",
			"Sudan",
			"Guinea",
			"Kenya",
			"Ghana",
			"Namibia",
			"Seychelles",
			"Gabon",
			"Mauritania",
			"Rwanda",
			"Central African Republic",
			"Equatorial Guinea",
			"Benin",
			"Liberia",
			"Somalia",
			"Tanzania",
			"Burkina Faso",
			"Congo (Kinshasa)",
			"Cote d'Ivoire",
			"Reunion",
			"Eswatini",
			"Congo (Brazzaville)",
			"Mayotte",
			"Republic of the Congo"

		]
	},
	{
		"continent": "Asia",
		"countries": [
			"Thailand",
			"Japan",
			"Singapore",
			"Nepal",
			"Malaysia",
			"Cambodia",
			"Sri Lanka",
			"United Arab Emirates",
			"Philippines",
			"India",
			"Lebanon",
			"Iraq",
			"Oman",
			"Afghanistan",
			"Bahrain",
			"Kuwait",
			"Israel",
			"Pakistan",
			"Qatar",
			"Indonesia",
			"Saudi Arabia",
			"Jordan",
			"Bhutan",
			"Maldives",
			"Bangladesh",
			"Brunei",
			"Mongolia",
			"China",
			"Iran",
			"Vietnam",
			"Turkey",
			"Kazakhstan",
			"Uzbekistan",
			"Korea, South",
			"Taiwan*",
			"occupied Palestinian territory",
		]
	},
	{
		"continent": "Europe",
		"countries": [
			"Germany",
			"Finland",
			"Italy",
			"Sweden",
			"Spain",
			"Belgium",
			"Croatia",
			"Switzerland",
			"Austria",
			"Georgia",
			"Greece",
			"Norway",
			"Romania",
			"Estonia",
			"San Marino",
			"Belarus",
			"Iceland",
			"Lithuania",
			"Ireland",
			"Luxembourg",
			"Monaco",
			"Azerbaijan",
			"Armenia",
			"Portugal",
			"Andorra",
			"Latvia",
			"Ukraine",
			"Hungary",
			"Liechtenstein",
			"Poland",
			"Bosnia and Herzegovina",
			"Slovenia",
			"Serbia",
			"Slovakia",
			"Malta",
			"Bulgaria",
			"Albania",
			"Cyprus",
			"France",
			"Denmark",
			"Moldova",
			"United Kingdom",
			"Netherlands",
			"North Macedonia",
			"Czechia",
			"Russia",
			"Jersey",
			"Guernsey",
			"Kosovo"
		]
	},
	{
		"continent": "North America",
		"countries": [
			"Canada",
			"Mexico",
			"Dominican Republic",
			"Costa Rica",
			"US",
			"Panama",
			"Honduras",
			"Jamaica",
			"Cuba",
			"Antigua and Barbuda",
			"Trinidad and Tobago",
			"Guatemala",
			"Saint Lucia",
			"Saint Vincent and the Grenadines",
			"Puerto Rico",
			"Greenland",
			"The Bahamas"
		]
	},
	{
		"continent": "Oceania",
		"countries": [
			"Australia",
			"New Zealand",
			"Guam"
		]
	},
	{
		"continent": "South America",
		"countries": [
			"Brazil",
			"Ecuador",
			"Argentina",
			"Chile",
			"Colombia",
			"Peru",
			"Paraguay",
			"Bolivia",
			"Guyana",
			"Uruguay",
			"Venezuela",
			"Suriname",
			"Martinique",
			"Guadeloupe",
			"Aruba",
			"French Guiana"
		]
	},
	{
		"continent": "Other",
		"countries": [
			"Holy See",
			"Cruise Ship"
		]
	}
]

let tOut = []
territories.forEach((cont)=>{
	let t = Territory.get(cont.continent, Territory.CONTINENT)
	cont.countries.forEach((country)=>{
		t.add_child(country, Territory.COUNTRY)
	})
	tOut.push(t)
})

return tOut
}
