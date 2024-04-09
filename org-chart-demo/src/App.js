import logo from './logo.svg';
import './App.css';
import { OrgChartComponent } from './org-chart/org-chart';
import { useState, useLayoutEffect } from 'react';




function App() {

  const [currentData, seTCurrentData] = useState([]);
  const [orgChart, setOrgChart] = useState(null)

  function onRedirectButtonClick() {
    const redirectUrlBase = 'https://example.com'
    const orgChartData = orgChart.data();


    const selectedNodes = orgChartData.filter(d => d._selected).map(d => d.ID)
    const confirmedNodes = orgChartData.filter(d => d._confirmed).map(d => d.ID)

    const queryObj = JSON.stringify({ confirmedNodes, selectedNodes })
    const queryString = '?query=' + encodeURIComponent(queryObj)

    window.open(redirectUrlBase + queryString, '_blank');

    // To parse this query string on our end, you will need to do following
    // 1. Get `query` parameter value from url
    // 2. Use decodeURIComponent(queryVal) function to get stringifiedJson
    // 3. Use JSON.parse(stringifiedJson) to get actual values


    console.log('clicking', selectedNodes, confirmedNodes)
  }


  useLayoutEffect(() => {
    fetch('/data/data_0.json')
      .then(d => d.json())
      .then(data => {
        console.log('fetched')
        seTCurrentData(data)
      })
  }, [1]);

  return (
    <div className="App">
      <button onClick={() => {
        onRedirectButtonClick()
      }}>Redirect With Selected Nodes Data</button>
      <OrgChartComponent
        setOrgChart={setOrgChart}
        data={currentData}
      />
    </div>
  );
}

export default App;
