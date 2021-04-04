  const  path_estabelecimentos = path_data+"empresa_estado.csv";

  const width = 960
  const height = 600
  const svg = d3.select(DOM.svg(width, height))
  let path = d3.geoPath()
  
  svg.append("g")
      .attr("class", "counties")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
      .attr("fill", d => colorScale(rateById.get(d.id)))
      .attr("d", path)
      .on("mouseover", function(d){
        d3.select(this) // seleciona o elemento atual
        .style("cursor", "pointer") //muda o mouse para mãozinha
        .attr("stroke","#FFF5B1")
        .attr("stroke-width", 3);
    
        const rect = this.getBoundingClientRect();
          showTooltip(d.id, rect.x, rect.y);
         }).on("mouseout", function(d) {
             d3.select(this).style("cursor", "default")
               .attr("stroke-width", 0)
               .attr("stroke","none");
    
        hideTooltip();
       })

  svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path)
  return svg.node()


tooltip = {
  d3.select("#tooltip").remove()
  let node = d3.select("body")
      .append("div")
      .attr("id","tooltip")
      .attr("class","hidden")
      .append("p")
      .html("<h4 id='name_county'></h4>Taxa de desemprego: <span id='taxa'></span>%")
  return node
}

function showTooltip(county_id, x, y) {
  const offset = 10;
  const t = d3.select("#tooltip");
  
    t.select("#taxa").text(rateById.get(county_id));
    t.select("#name_county").text(name_countys.get(county_id));
    t.classed("hidden", false);
  
  const rect = t.node().getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (((x + offset) + height) > width) {
    x = x - width;
  }

  t.style("left", x + offset + "px").style("top", y - height + "px");
}

function hideTooltip() {
  d3.select("#tooltip").classed("hidden", true)
}

colorScale = d3.scaleQuantize()
                .domain([1,10])
                .range(d3.schemeGreens[9])

rateById = 
d3.tsv("https://github.com/CaioViktor/VizRFB/blob/main/static/data/brazil.json").then(function (data) {
  let rateMap = new Map()
  data.forEach(function(d) {
    rateMap.set(d.id, +d.rate)
  })
  return rateMap
})

us = d3.json("https://github.com/CaioViktor/VizRFB/blob/main/static/data/brazil.json")

name_countys = d3.csv("https://gist.githubusercontent.com/emanueles/19cf3828bab232612c2b1599d831f690/raw/ddbaf62af22512a39360cc6741b40f5588b44aa0/county_names.csv").then(function (data) {
  let nameMap = new Map()
  data.forEach(function(d) {
    nameMap.set(d.id, d.name)
  })
  return nameMap
})

d3 = require('d3@5')

topojson = require("topojson-client@3")

 //    //Fechados
 // 	let dim_fechados_date_start = facts.dimension(d=>d.situationDate);

	// let _group_fechados = dim_fechados_date_start.filter(d=>d.situation == "Baixada").group().reduceSum(function(d){return 1});
	// var group_fechados_date_start = {
	// 	all:function () {
	// 		var cumulate = 0;
	// 		var g = [];
	// 		_group_fechados.all().forEach(function(d,i) {
	// 			cumulate += d.value;
	// 			g.push({key:d.key,value:cumulate,'in_day':d.value})
	// 		});
	// 		return g;
	// 	}
	// };
	// let hourScale_fechados = d3.scaleTime().domain(d3.extent(data,d=> d.situationDate))

	// lineChartF.width(w)
 //            .height(h)
 // 			.margins({left: 80, top: 20, right: 10, bottom: 40})
 //            .dimension(dim_fechados_date_start)
 //            .group(group_fechados_date_start)
 //            .x(hourScale_fechados)
 //            .renderArea(true)
 //            .yAxisLabel("Quantidade de estabelecimentos fechados")
	//         .xAxisLabel("Ano de início das atividades")
	//         .clipPadding(10)
	//         .elasticY(true)
	//         .title(function(d) { return 'Dia: ' + d.key+'\nAcumulado: '+ d.value+'\nNo dia: '+d.in_day; })
 //            .brushOn(false)
 //            .mouseZoomable(true);
           












  dc.renderAll()
});