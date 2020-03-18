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

# TBD XXX
* double click to check only that country
* label: highlight current line (najedu na zemi a vidim i ostatní, víc zřetelné, která)
* hightlight hovered line
* jiné default countries
* hashovat hidden očka
* south korea duplication bug
* mobily, at to neni v jednom sloupci
* ui change chart size
* the data are now rounded – round them on label only
* outbreak – disable range slider
* Axe Y name ID – když fce nesdílí škálu, zobrazí se do též velikosti grafu, neroztáhne ho

* číslo figury do malého tagu grafů – neukládá se ještě do hashe. Axy se mají stát parametrem Figure.
    * nefunguje moc dobře přepínání, jestli jsou zaplé
* lepší popis graf title – a vyměnit tam C/R/D
* když měním days range, nemizí legend
* ion opposite outbreak škála (intuitivnější z druhé strany)
* outbreak skrývání moc nejde


## nice to have:
* hide countries: třeba jen do nadpisu "Countries (3 hidden)"
* github open source
* hezčí barvičky zemí (vlaječky)
* on hover, label each date for country (not only reported value, but also state its date)
* legend: sort
* disable territories with zero data
* XXX oko nereaguje úplně 100%