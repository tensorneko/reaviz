import React from 'react';
import { storiesOf } from '@storybook/react';
import { Map } from './Map';
import { MapMarker } from './MapMarker';
import { feature } from 'topojson-client';
import geojson from 'world-atlas/countries-110m.json';

// Using 'countries' is less performant than 'land' but we want to be able
// to filter and disect on specific shapes
const worldData = feature(geojson as any, geojson.objects.countries as any);

storiesOf('Demos|Map', module)
  .add('Simple', () => <Map data={worldData} height={350} width={500} />)
  .add('Autosize', () => (
    <div style={{ width: '50vw', height: '50vh', border: 'solid 1px red' }}>
      <Map data={worldData} />
    </div>
  ))
  .add('Markers', () => (
    <Map
      data={worldData}
      height={350}
      width={500}
      markers={[
        <MapMarker coordinates={[-122.490402, 37.786453]} />,
        <MapMarker coordinates={[-58.3816, -34.6037]} />,
        <MapMarker coordinates={[-97.7437, 30.2711]} tooltip="Austin, TX" />
      ]}
    />
  ));
