// World Bank population data - https://data.worldbank.org/indicator/SP.POP.TOTL
let territories = [
	{
		"continent": "Africa",
		"countries": [
			{
				"name": "Egypt",
				"pop": "95688681"
			},
			{
				"name": "Algeria",
				"pop": "40606052"
			},
			{
				"name": "Nigeria",
				"pop": "185989640"
			},
			{
				"name": "Morocco",
				"pop": "35276786"
			},
			{
				"name": "Senegal",
				"pop": "15411614"
			},
			{
				"name": "Tunisia",
				"pop": "11403248"
			},
			{
				"name": "South Africa",
				"pop": "55908865"
			},
			{
				"name": "Cameroon",
				"pop": "23439189"
			},
			{
				"name": "Togo",
				"pop": "7606374"
			},
			{
				"name": "Ethiopia",
				"pop": "102403196"
			},
			{
				"name": "Sudan",
				"pop": "39578828"
			},
			{
				"name": "Guinea",
				"pop": "12395924"
			},
			{
				"name": "Kenya",
				"pop": "48461567"
			},
			{
				"name": "Ghana",
				"pop": "28206728"
			},
			{
				"name": "Namibia",
				"pop": "2479713"
			},
			{
				"name": "Seychelles",
				"pop": "94677"
			},
			{
				"name": "Gabon",
				"pop": "1979786"
			},
			{
				"name": "Mauritania",
				"pop": "4301018"
			},
			{
				"name": "Rwanda",
				"pop": "11917508"
			},
			{
				"name": "Central African Republic",
				"pop": "4594621"
			},
			{
				"name": "Equatorial Guinea",
				"pop": "1221490"
			},
			{
				"name": "Benin",
				"pop": "10872298"
			},
			{
				"name": "Liberia",
				"pop": "4613823"
			},
			{
				"name": "Somalia",
				"pop": "14317996"
			},
			{
				"name": "Tanzania",
				"pop": "55572201"
			},
			{
				"name": "Burkina Faso",
				"pop": "18646433"
			},
			{
				"name": "Congo (Kinshasa)",
				"pop": ""
			},
			{
				"name": "Cote d'Ivoire",
				"pop": "23695919"
			},
			{
				"name": "Reunion",
				"pop": ""
			},
			{
				"name": "Eswatini",
				"pop": ""
			},
			{
				"name": "Congo (Brazzaville)",
				"pop": ""
			},
			{
				"name": "Mayotte",
				"pop": ""
			},
			{
				"name": "Republic of the Congo",
				"pop": ""
			}
		]
	},
	{
		"continent": "Asia",
		"countries": [
			{
				"name": "Thailand",
				"pop": "68863514"
			},
			{
				"name": "Japan",
				"pop": "126994511"
			},
			{
				"name": "Singapore",
				"pop": "5607283"
			},
			{
				"name": "Nepal",
				"pop": "28982771"
			},
			{
				"name": "Malaysia",
				"pop": "31187265"
			},
			{
				"name": "Cambodia",
				"pop": "15762370"
			},
			{
				"name": "Sri Lanka",
				"pop": "21203000"
			},
			{
				"name": "United Arab Emirates",
				"pop": "9269612"
			},
			{
				"name": "Philippines",
				"pop": "103320222"
			},
			{
				"name": "India",
				"pop": "1324171354"
			},
			{
				"name": "Lebanon",
				"pop": "6006668"
			},
			{
				"name": "Iraq",
				"pop": "37202572"
			},
			{
				"name": "Oman",
				"pop": "4424762"
			},
			{
				"name": "Afghanistan",
				"pop": "34656032"
			},
			{
				"name": "Bahrain",
				"pop": "1425171"
			},
			{
				"name": "Kuwait",
				"pop": "4052584"
			},
			{
				"name": "Israel",
				"pop": "8547100"
			},
			{
				"name": "Pakistan",
				"pop": "193203476"
			},
			{
				"name": "Qatar",
				"pop": "2569804"
			},
			{
				"name": "Indonesia",
				"pop": "261115456"
			},
			{
				"name": "Saudi Arabia",
				"pop": "32275687"
			},
			{
				"name": "Jordan",
				"pop": "9455802"
			},
			{
				"name": "Bhutan",
				"pop": "797765"
			},
			{
				"name": "Maldives",
				"pop": "417492"
			},
			{
				"name": "Bangladesh",
				"pop": "162951560"
			},
			{
				"name": "Brunei",
				"pop": "423196"
			},
			{
				"name": "Mongolia",
				"pop": "3027398"
			},
			{
				"name": "China",
				"pop": "1378665000"
			},
			{
				"name": "Iran",
				"pop": "80277428"
			},
			{
				"name": "Vietnam",
				"pop": "92701100"
			},
			{
				"name": "Turkey",
				"pop": "79512426"
			},
			{
				"name": "Kazakhstan",
				"pop": "17797032"
			},
			{
				"name": "Uzbekistan",
				"pop": "31848200"
			},
			{
				"name": "Korea, South",
				"pop": "51245707"
			},
			{
				"name": "Taiwan*",
				"pop": "23780452"
			},
			{
				"name": "occupied Palestinian territory",
				"pop": "5114000"
			}
		]
	},
	{
		"continent": "Europe",
		"countries": [
			{
				"name": "Germany",
				"pop": "82667685"
			},
			{
				"name": "Finland",
				"pop": "5495096"
			},
			{
				"name": "Italy",
				"pop": "60600590"
			},
			{
				"name": "Sweden",
				"pop": "9903122"
			},
			{
				"name": "Spain",
				"pop": "46443959"
			},
			{
				"name": "Belgium",
				"pop": "11348159"
			},
			{
				"name": "Croatia",
				"pop": "4170600"
			},
			{
				"name": "Switzerland",
				"pop": "8372098"
			},
			{
				"name": "Austria",
				"pop": "8747358"
			},
			{
				"name": "Georgia",
				"pop": "3719300"
			},
			{
				"name": "Greece",
				"pop": "10746740"
			},
			{
				"name": "Norway",
				"pop": "5232929"
			},
			{
				"name": "Romania",
				"pop": "19705301"
			},
			{
				"name": "Estonia",
				"pop": "1316481"
			},
			{
				"name": "San Marino",
				"pop": "33203"
			},
			{
				"name": "Belarus",
				"pop": "9507120"
			},
			{
				"name": "Iceland",
				"pop": "334252"
			},
			{
				"name": "Lithuania",
				"pop": "2872298"
			},
			{
				"name": "Ireland",
				"pop": "4773095"
			},
			{
				"name": "Luxembourg",
				"pop": "582972"
			},
			{
				"name": "Monaco",
				"pop": "38499"
			},
			{
				"name": "Azerbaijan",
				"pop": "9762274"
			},
			{
				"name": "Armenia",
				"pop": "2924816"
			},
			{
				"name": "Portugal",
				"pop": "10324611"
			},
			{
				"name": "Andorra",
				"pop": "77281"
			},
			{
				"name": "Latvia",
				"pop": "1960424"
			},
			{
				"name": "Ukraine",
				"pop": "45004645"
			},
			{
				"name": "Hungary",
				"pop": "9817958"
			},
			{
				"name": "Liechtenstein",
				"pop": "37666"
			},
			{
				"name": "Poland",
				"pop": "37948016"
			},
			{
				"name": "Bosnia and Herzegovina",
				"pop": "3516816"
			},
			{
				"name": "Slovenia",
				"pop": "2064845"
			},
			{
				"name": "Serbia",
				"pop": "7057412"
			},
			{
				"name": "Slovakia",
				"pop": "5428704"
			},
			{
				"name": "Malta",
				"pop": "436947"
			},
			{
				"name": "Bulgaria",
				"pop": "7127822"
			},
			{
				"name": "Albania",
				"pop": "2876101"
			},
			{
				"name": "Cyprus",
				"pop": "1170125"
			},
			{
				"name": "France",
				"pop": "66896109"
			},
			{
				"name": "Denmark",
				"pop": "5731118"
			},
			{
				"name": "Moldova",
				"pop": "3552000"
			},
			{
				"name": "United Kingdom",
				"pop": "65637239"
			},
			{
				"name": "Netherlands",
				"pop": "17018408"
			},
			{
				"name": "North Macedonia",
				"pop": "2081206"
			},
			{
				"name": "Czechia",
				"pop": "10561633"
			},
			{
				"name": "Russia",
				"pop": "144342396"
			},
			{
				"name": "Jersey",
				"pop": ""
			},
			{
				"name": "Guernsey",
				"pop": ""
			},
			{
				"name": "Kosovo",
				"pop": "1816200"
			}
		]
	},
	{
		"continent": "North America",
		"countries": [
			{
				"name": "Canada",
				"pop": "36286425"
			},
			{
				"name": "Mexico",
				"pop": "127540423"
			},
			{
				"name": "Dominican Republic",
				"pop": "10648791"
			},
			{
				"name": "Costa Rica",
				"pop": "4857274"
			},
			{
				"name": "US",
				"pop": "323127513"
			},
			{
				"name": "Panama",
				"pop": "4034119"
			},
			{
				"name": "Honduras",
				"pop": "9112867"
			},
			{
				"name": "Jamaica",
				"pop": "2881355"
			},
			{
				"name": "Cuba",
				"pop": "11475982"
			},
			{
				"name": "Antigua and Barbuda",
				"pop": "100963"
			},
			{
				"name": "Trinidad and Tobago",
				"pop": "1364962"
			},
			{
				"name": "Guatemala",
				"pop": "16582469"
			},
			{
				"name": "Saint Lucia",
				"pop": ""
			},
			{
				"name": "Saint Vincent and the Grenadines",
				"pop": ""
			},
			{
				"name": "Puerto Rico",
				"pop": "3411307"
			},
			{
				"name": "Greenland",
				"pop": "56186"
			},
			{
				"name": "The Bahamas",
				"pop": "391232"
			}
		]
	},
	{
		"continent": "Oceania",
		"countries": [
			{
				"name": "Australia",
				"pop": "24127159"
			},
			{
				"name": "New Zealand",
				"pop": "4692700"
			},
			{
				"name": "Guam",
				"pop": "162896"
			}
		]
	},
	{
		"continent": "South America",
		"countries": [
			{
				"name": "Brazil",
				"pop": "207652865"
			},
			{
				"name": "Ecuador",
				"pop": "16385068"
			},
			{
				"name": "Argentina",
				"pop": "43847430"
			},
			{
				"name": "Chile",
				"pop": "17909754"
			},
			{
				"name": "Colombia",
				"pop": "48653419"
			},
			{
				"name": "Peru",
				"pop": "31773839"
			},
			{
				"name": "Paraguay",
				"pop": "6725308"
			},
			{
				"name": "Bolivia",
				"pop": "10887882"
			},
			{
				"name": "Guyana",
				"pop": "773303"
			},
			{
				"name": "Uruguay",
				"pop": "3444006"
			},
			{
				"name": "Venezuela",
				"pop": "31568179"
			},
			{
				"name": "Suriname",
				"pop": "558368"
			},
			{
				"name": "Martinique",
				"pop": ""
			},
			{
				"name": "Guadeloupe",
				"pop": ""
			},
			{
				"name": "Aruba",
				"pop": "104822"
			},
			{
				"name": "French Guiana",
				"pop": ""
			}
		]
	},
	{
		"continent": "Other",
		"countries": [
			{
				"name": "Holy See",
				"pop": ""
			},
			{
				"name": "Cruise Ship",
				"pop": ""
			}
		]
	}
];

var world = Territory.get("World", Territory.CONTINENT);

// build continents
territories.forEach((cont) => {
    let t = Territory.get(cont.continent, Territory.CONTINENT);
    cont.countries.forEach((country) => {
        t.add_child(Territory.get(country.name, Territory.COUNTRY, parseInt(country.pop)));
    });
    world.add_child(t);
});
