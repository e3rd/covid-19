# CHANGELOG

* main functionality working
* window hash changed accordingly
* smooth chart updating
* mobile view
* PNG export (via right button)
* possible to display provinces, countries and continents and freely combine
* hide labels with no data in current view (mitigate legend spread)
* world
* legend
* aggregate territories into single curve
* arbitrary arithmetic plot function expression, evaluating territory data
* range sliders custom value, changing boundaries according to current data
* zooming
* UI regrouping
* multiple figures possible
* tooltip sort by value
* highlight hovered line, clicked line to toggle star
* hide the country from the figure if it has no data (ex: because of the date range settings)

# TBD XXX
* jiné default countries
* hashovat hidden očka
* south korea duplication bug
* UI
    * mobily, at territories nejsou v jednom sloupci
    * ui change chart size
    * reset zoom -> add radio: zooming / panning; checkbox (wheel zooming), decimal places

* Axe Y name ID – když fce nesdílí škálu, zobrazí se do též velikosti grafu, neroztáhne ho
* axes should become figure parameters (input to toggle if the axes input manipulate single figure or all of them)
* když měním days range, nemizí legend zemí, které se nevešly
* když adélka klikne na fajfčičku, chce země defaultně zaškrnout, ne odškrtnout



## nice to have:
* bug: stars interreact through figures; when clicked on a figure and axe change, the territory un/stars on every other scale (while starred aggreagation Sum curve gets forgot and disappears)
* ion opposite outbreak škála (highlight from right to left, not from left to right) (intuitivnější z druhé strany)
* hide countries: třeba jen do nadpisu "Countries (3 hidden)"
* country colours, flags or two-letter abbreviation
* on hover, label each date for country (not only reported value, but also state its date)
* oko nereaguje úplně 100%
* legend double click to check only that country
* complex
    * outbreak -> turn to filter with any arbitrary condition (ex: start counting when R > 20)