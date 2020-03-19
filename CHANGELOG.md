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

# TBD XXX
* double click to check only that country
* label: highlight current line (najedu na zemi a vidim i ostatní, víc zřetelné, která)
* hightlight hovered line <- this may help https://www.chartjs.org/samples/latest/tooltips/custom-points.html
* jiné default countries
* hashovat hidden očka
* south korea duplication bug
* UI
    * mobily, at territories nejsou v jednom sloupci
    * ui change chart size
    * reset zoom -> add radio: zooming / panning; checkbox (wheel zooming), decimal places

* Axe Y name ID – když fce nesdílí škálu, zobrazí se do též velikosti grafu, neroztáhne ho

* číslo figury do malého tagu grafů – neukládá se ještě do hashe. Axy se mají stát parametrem Figure.
    * nefunguje moc dobře přepínání, jestli jsou zaplé
* lepší popis graf title – a vyměnit tam C/R/D
* když měním days range, nemizí legend
* ion opposite outbreak škála (intuitivnější z druhé strany)
* outbreak skrývání moc nejde
* když adélka klikne na fajfčičku, chce země defaultně zaškrnout, ne odškrtnout



## nice to have:
* hide countries: třeba jen do nadpisu "Countries (3 hidden)"
* github open source
* hezčí barvičky zemí (vlaječky)
* on hover, label each date for country (not only reported value, but also state its date)
* legend: sort
* disable territories with zero data
* XXX oko nereaguje úplně 100%
* outbreak -> turn to filter with any arbitrary condition (ex: start counting when R > 20)