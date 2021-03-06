/*jslint browser: true*/
/*global L, flatpickr */

(function (window, document, L, undefined) {

'use strict';

const minDate = '26.06.2017';
const maxDate = '30.09.2017';

moment.locale('de');

const $infolayer = document.querySelector('.js-infolayer');

function addDataLayerToMap(map, data) {

  // remove active street layer, if any is set
  if (streetLayer !== null) {
    map.removeLayer(streetLayer);
  }

  let styles = {
    base: { color: '#ff335b', weight: 3 },
    mouseover: { color: '#ff0000' }
  };

  let selectedStreetSegments = [];

	streetLayer = L.geoJson(data, {
    stroke: true,
    color: styles.base.color,
    weight: styles.base.weight,
    onEachFeature: (feature, layer) => {
      let content = feature.properties.tags.name;
      let maxspeed = feature.properties.tags.maxspeed;
      content += (maxspeed) ? ` (${maxspeed} km/h)` : '';

      layer.bindPopup(content, {
        sticky: true
      });

      layer.on('mouseover', (e) => {
        layer.openPopup();
        // reset selected segments, if any
        if (selectedStreetSegments.length > 0) {
          selectedStreetSegments.forEach((f) => f.setStyle(styles.base));
        }
        selectedStreetSegments = streetLayer.getLayers().filter((l) => {
          return l.feature.properties.tags.name === e.target.feature.properties.tags.name;
        });
        selectedStreetSegments.forEach((l) => {
          l.setStyle(styles.mouseover);
        });

      });

      layer.on('mouseout', (e) => {});
     }
  });

	streetLayer.addTo(map);
}

function loadDataLayer(date, callbacks) {

  var fileName = dateToFileName(date);

  const req = new XMLHttpRequest();

  req.onreadystatechange = () => {
    if (req.readyState === 4 && req.status === 404) {
      if (callbacks && callbacks.onError) {
        callbacks.onError();
      }
      return;
    }
    if (req.readyState === 4 && req.status === 200) {
      const data = JSON.parse(req.responseText);
      addDataLayerToMap(map, data);
      if (callbacks && callbacks.onSuccess) {
        callbacks.onSuccess();
      }
    }
  };

  req.open('GET', './data/' + fileName + '.geojson', true);
  req.send();
}

function dateToFileName(date) {
  date = date.split('.');
  return date[2]+'-'+date[1]+'-'+date[0];
}

function checkDate(dateObj) {
  const day = dateObj.getDay();
  if (day === 6 || day === 0) return false;

  return true;
}

function showInfoLayer() {
  // do not animate again, if already visible
  if (!$infolayer.classList.contains('is-hidden')) {
    return;
  }
  let height = null;

  $infolayer.classList.remove('is-hidden');
  height = $infolayer.getBoundingClientRect().height;
  $infolayer.style.height = 0;

  window.setTimeout(function() {
    $infolayer.style.height = height + 'px';
  }, 20);
}

function hideInfoLayer() {
  // do not animate again, if element is already hidden
  if ($infolayer.classList.contains('is-hidden')) {
    return;
  }
  $infolayer.style.height = 0;

  window.setTimeout(function() {
    $infolayer.classList.add('is-hidden');
    $infolayer.style.height = null;
  }, 500);
}

// instance of current street layer
let streetLayer = null;

let bounds = [
  [51.291124, 6.405716],
  [51.60693, 7.630692]
];

// create leaflet map
let map = L.map('map', {
  center: [51.457087, 7.011429],
  zoom: 12,
  maxBounds: bounds
});

L.Icon.Default.imagePath = 'images/';

// add default stamen tile layer
let baseLayer = new L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
  minZoom: 12,
  maxZoom: 18,
  bounds: bounds,
  attribution: 'Daten zu Geschwindigkeitskontrollen: <a href="http://www.use24.essen.de/Webportal/agency/default.aspx?PortalObjectId=18399&OrganizationUnitId=1426">Ordnungsamt der Stadt Essen</a>. Kartendaten © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
});
baseLayer.addTo(map);

let datePicker = flatpickr('#js-date-picker', {
  defaultDate: 'today',
  dateFormat: 'd.m.Y',
  minDate: minDate,
  enableTime: false,
  locale: {
    firstDayOfWeek: 1
  },
  // load data for today
  onReady: (selectedDates, dateStr, instance) => {
    if (dateStr !== '') {
      if (checkDate(instance.parseDate(dateStr))) {
        loadDataLayer(dateStr);
      }
      else {
        showInfoLayer();
      }
    }
  },
  onChange: (selectedDates, dateStr, instance) => {
    if (dateStr !== '') {
      if (!checkDate(instance.parseDate(dateStr))) {
        showInfoLayer();
        if (streetLayer !== null) {
          map.removeLayer(streetLayer);
        }
        return;
      }
      loadDataLayer(dateStr, {
        onSuccess: function() {
          hideInfoLayer();
        },
        onError: function() {
          showInfoLayer();
          if (streetLayer !== null) {
            map.removeLayer(streetLayer);
          }
        }
      });
    }
  }
});

document.getElementById('js-prev-date').addEventListener('click', (e) => {
  let value = document.getElementById('js-date-picker').value;
  let currentDate = moment(value, 'DD.MM.YYYY');
  let newDate = currentDate.subtract(1, 'd');
  datePicker.setDate(newDate.format('DD.MM.YYYY'), true);
});

document.getElementById('js-next-date').addEventListener('click', (e) => {
  let value = document.getElementById('js-date-picker').value;
  let currentDate = moment(value, 'DD.MM.YYYY');
  let newDate = currentDate.add(1, 'd');
  datePicker.setDate(newDate.format('DD.MM.YYYY'), true);
});

}(window, document, L));
