import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3'



export const OrgChartComponent = (props, ref) => {
    const d3Container = useRef(null);
    const chartRef = useRef(new OrgChart());
    useLayoutEffect(() => {
        console.log('rendering')
        if (props.data && d3Container.current) {
            let hierarchicalData = getHierarchyData(props.data)
            chartRef.current
                .container(d3Container.current)
                .compact(false)
                .layout('bottom')
                .nodeWidth((node) => 202)
                .nodeHeight((node) => 120)
                .compactMarginBetween((d) => 60)
                .compactMarginPair((d) => 100)
                .childrenMargin((d) => 100)
                .neighbourMargin((a, b) => 60)
                .defaultFont('Montserrat')
                .linkUpdate(function (d, i, arr) {
                    d3.select(this)
                        .attr("stroke", d => d.data._upToTheRootHighlighted ? '#E27396' : '#E4E2E9')
                        .attr("stroke-width", d => d.data._upToTheRootHighlighted ? 5 : 4)

                    if (d.data._upToTheRootHighlighted) {
                        d3.select(this).raise()
                    }
                })
                .nodeContent((node) => {
                    let typeColor = '#E5E5E5';
                    if (node.data.Type == 'LP') typeColor = '#2596be';
                    if (node.data.Type == 'NP') typeColor = '#b6d7a8';

                    return `<div tabindex='0' style="border:${node.data._selected ? `8px solid #E2B33E` : `1px solid #737373`};background-color:#E5E5E5;width:${node.width - 2}px;margin:0px;height:${node.height}px"> 
                            <div style="background-color:${typeColor};height:10px"></div>
                            <div style="height:calc(100% - 20px);padding:5px;display:flex;justify-content:space-between;flex-direction:column">
                                <div>
                                    <div style="font-size:16px;font-weight:bold"> ${node.data.Name}  </div>
                                    <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
                                         <div>${node.data.DateOfBirth_OR_RegisterNumber}  </div>
                                         <div style='margin-right:55px'>
                                            <label tabindex="0"  class="switch">
                                            
                                              <input class='confirm-input' type="checkbox" ${node.data._confirmed ? 'checked' : ''} >
                                              <span class="slider round"></span>
                                              <div class='confirm-text' style="margin-top: -12px; margin-left: 33px;">Confirm  </div>
                                            </label>
                                           
                                        </div>
                                    </div>
                                    
                                </div>
                               
                                <div style="display:grid;grid-template-columns:auto auto;">
                                    <div>Commercial Int. Reason</div><div style="font-weight:bold">${node.data.CommercialInterestReason}</div>
                                    <div>Commercial Int. Amount</div><div style="font-weight:bold">${node.data.CommercialInterestAmount}</div>
                                </div>
                               
                             </div>
                           
                        </div>`;
                })
                .nodeUpdate(function (d, i, arr) {

                    const node = d3.select(this);
                    const parentNode = node.node()
                    node.on('keydown.node', (event, node) => {
                        const { data } = node;
                        console.log(event.srcElement.classList)
                        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                            if ([...event.srcElement.classList].includes("switch")) {
                                buttonConfirm(d, chartRef.current)
                                return;
                            }
                            if ([...event.srcElement.classList].includes("node-button-foreign-object")) {
                                return;
                            }
                            if ([...event.srcElement.classList].includes("paging-button-wrapper")) {
                                this.loadPagingNodes(node);
                                return;
                            }
                            if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                                d.data._selected = !d.data._selected;
                                chartRef.current.render()
                            }
                        }
                    })
                    d3.select(parentNode)
                        .attr('data-tabindex', '0')
                        .attr('tabIndex', '0')
                    node.select('.confirm-input').on('change.confirm', e => {
                        buttonConfirm(d, chartRef.current)
                    })

                    node.on('click.select', e => {
                        if (e.srcElement.classList.contains('confirm-input')) {
                            return;
                        }
                        if (e.srcElement.classList.contains('confirm-text')) {
                            return;
                        }
                        if (e.srcElement.classList.contains('slider')) {
                            return;
                        }
                        d.data._selected = !d.data._selected;
                        chartRef.current.render();
                    })
                })
                .data(hierarchicalData)
                .render();

            if (hierarchicalData.length) {
                chartRef.current.fit()
                props.setOrgChart(chartRef.current)
            }
        }
    }, [props.data, d3Container.current]); // 3. Listen to changes and rerender the graph with new data

    return (
        <div>
            {/*   Get DOM element reference */}
            <div ref={d3Container} />
        </div>
    );
};


function buttonConfirm(d, chart) {
    d.data._confirmed = !d.data._confirmed;
    // Find all nodes with the same ID and update confirmation
    chart.data().filter(dataObj => dataObj.ID == d.data.ID)
        .forEach(dataObj => {
            dataObj._confirmed = d.data._confirmed
        })
    chart.updateNodesState()
}

function getChildrenNodes(nodeId, dataWithIds, uniqNodes, uniqNodesParent) {
    if (nodeId == "") return [];
    return dataWithIds
        .filter((d) => d.ID == nodeId)
        .map((d) => uniqNodes.get(d.ParentID))
        .filter((d) => d)
        .map((d) => {
            return {
                ...d,
                CommercialInterestReason: uniqNodesParent.get(nodeId + "_" + d.ID)
                    .CommercialInterestReason,
                CommercialInterestAmount: uniqNodesParent.get(nodeId + "_" + d.ID)
                    .CommercialInterestAmount
            };
        });
}

function getHierarchyData(dataSample) {
    if (dataSample.length == 0) {
        return []
    }
    let dataWithIds = dataSample
        .slice()
        .sort((a, b) => a.ID - b.ID)
        .map((d, i) => {
            return {
                ...d
            };
        });
    let uniqNodes = new Map(dataWithIds.map((d) => [d.ID, d]))
    let uniqNodesParent = new Map(dataWithIds.map((d) => [d.ID + "_" + d.ParentID, d]))
    let level = 0;
    let id = 2;
    let nodes = [
        {
            ...dataWithIds[0],
            id: 1,
            parentId: null,
            customLevel: level
        }
    ];

    let running = true;
    const includedNodes = new Set();
    while (running) {
        const prevLevelNodes = nodes.filter((d) => d.customLevel == level);

        prevLevelNodes.forEach((prevLevelNode) => {

            const childrenNodes = getChildrenNodes(prevLevelNode.ID, dataWithIds, uniqNodes, uniqNodesParent);
            let childrenNodesWithID = childrenNodes.map((ch) => {
                return {
                    ...ch,
                    id: id++,
                    _expanded: true,
                    parentId: prevLevelNode.id,
                    customLevel: level + 1
                };
            });

            if (!includedNodes.has(prevLevelNode.ID)) {
                childrenNodesWithID.forEach((ch) => {
                    nodes.push(ch);

                });

                includedNodes.add(prevLevelNode.ID)
            }


        });

        level++;

        // Break the loop if certain levels are reached
        if (level == 10000) {
            running = false;
        }
    }

    return nodes;
}