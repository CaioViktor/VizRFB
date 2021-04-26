 // const  path_estabelecimentos = path_data+"estabelecimenos_min.csv";
const  path_empresas = path_data+"dados_empresas.csv";


const  path_brazil = path_data+"brazil.json";

const width = 800
const height = 600

let margin = {top: 40, right: 40, bottom: 40, left: 40};


var w = window.innerWidth;
var h = window.innerHeight;

let dim_states = null;
let group_states = null;
let previous_this_map = null


var colh = h/2;
var colw = (33/100) * w;

let colorScale_mapa = null;
let state_name_mapa = new Map();
let state_population = new Map();
let facts = null;
let previous_filter = null;

var tabela = new dc.DataTable("#tabelaempresa");
var chartQ8 = new dc.ScatterPlot("#Q8");
var chartQ7 = new dc.PieChart("#Q7");

var runDimension7, runGroup, runDimensionQ8, speedSumGroup;



var ofs = 0, pag = 100;

function renderMap(data,maps){
  const svg = d3.select("#Q12").append("svg");


  const scaleValue = (colw*colh)*650/(633.6*474.5);
  
  
  var projection =  d3.geoMercator()
            // .scale(scaleValue)
            // .center([center0, center1]);
            .scale(scaleValue)
            .center([-52, -15])
              .translate([colw / 2, colh / 2]);

  path = d3.geoPath().projection(projection);



  svg.attr("width",colw)
    .attr("height",colh);
  svg.append("g")
    .attr("class", "states")
  .selectAll("path")
    .data(topojson.feature(data, data.objects.estados).features)
  .enter().append("path")
    .attr("fill", d => colorScale_mapa(maps[1].get(d.id)))
    // .attr("fill", "blue")
    .attr("d", path)
    .attr("element_id",d=>d.id)
    .on("click",function(d){
        d3.select(this) // seleciona o elemento atual
          .attr("stroke-width", 3)
          .attr("stroke","red");
        let clicked_state = this.getAttribute("element_id");
        if(clicked_state==previous_filter){
          d3.select(this) // seleciona o elemento atual
            .attr("stroke-width", 0)
            .attr("stroke","none"); //volta ao valor padrão
          clicked_state = null;
          // previous_this_map = null;
        }else{
          let previous_this_map = $("[element_id="+previous_filter+"]")[0];
          d3.select(previous_this_map) // seleciona o elemento atual
          .attr("stroke-width", 0)
          .attr("stroke","none"); //volta ao valor padrão
        }
        dim_states.filterExact(clicked_state);
        dc.renderAll();
        previous_filter = clicked_state;
        // previous_this_map = this;
    })
    .on("mouseover", function(d){
      d3.select(this) // seleciona o elemento atual
      .style("cursor", "pointer") //muda o mouse para mãozinha
      .attr("stroke-width", 3)
      .attr("stroke","#FFF5B1");
      
      const rect = this.getBoundingClientRect();
      showTooltip(maps,this.getAttribute("element_id"), rect.x, rect.y);
    })
  .on("mouseout", function(d){

      d3.select(this)
      .style("cursor", "default")
      .attr("stroke-width", 0)
      .attr("stroke","none"); //volta ao valor padrão
      if(previous_filter != null){
        let previous_this_map = $("[element_id="+previous_filter+"]")[0];
      d3.select(previous_this_map) // seleciona o elemento atual
          .attr("stroke-width", 3)
          .attr("stroke","red");
    }
      hideTooltip(maps);
  });

  svg.append("path")
    .datum(topojson.mesh(data, data.objects.estados, function(a, b) { return a !== b; }))
    .attr("class", "states")
    .attr("d", path)
  d3.select("#tooltip").remove()
    let node = d3.select("body")
        .append("div")
        .attr("id","tooltip")
        .attr("class","hidden")
        .append("p")
        .html("<h4 id='name_county'></h4>Quantidade de estabelecimentos: <span id='qtd'></span><br/>População: <span id='pop'></span><br/>Taxa de estabelecimentos para 100.000 habitantes: <b><span id='taxa'></span></b>")

  // Once we append the vis elments to it, we return the DOM element for Observable to display above.
  if(previous_filter!=null){
    let previous_this_map = $("[element_id="+previous_filter+"]")[0];
    d3.select(previous_this_map) // seleciona o elemento atual
          .attr("stroke-width", 3)
          .attr("stroke","red");
  }
  return svg.node()
}



function update_countStates(group){
 let map = new Map();
  let map_100000 = new Map();
  let states = group.all();
  states.forEach(function(d){
    map.set(d.key,+d.value);
    const population = state_population.get(d.key);
    const to_100000 = (d.value * 100000)/population;
    map_100000.set(d.key,to_100000);
  });

  return [map,map_100000];
}


function createLegend(color_scheme){
  let div = document.createElement('div');
  let labels = [],from, to;
  $(div).addClass('info legend');
  div.id = "legend";
  const n = color_scheme.length;

  for (let i = 0; i < n; i++) {
    let c = color_scheme[i]
        let fromto = colorScale_mapa.invertExtent(c);
    labels.push(
      '<i style="background:' + color_scheme[i] + '"></i> ' +
      d3.format(".3f")(fromto[0]) + (d3.format(".3f")(fromto[1]) ? '&ndash;' + d3.format(".3f")(fromto[1]) : '+'));
  }

div.innerHTML = "<b>Para 100.000 habitantes</b><br/>"+labels.join('<br>')
  const left =  (w*680)/1920;
  const top = (h*270)/949;
  $(div).css("position","absolute");
  $(div).css("left",left+"px");
  $(div).css("top",top+"px");
  if(w < 1200 || h < 640){
    const sw = w/1920;
    const sh = h/949;
    $(div).css("transform","scale("+sw+","+ sh+")")
  }

  // position: absolute;
  // left: 680px;
 //    top: 270px;
    $("#Q12").append(div);
}

function showTooltip(maps,element_id, x, y) {
  const offset = 10;
  const t = d3.select("#tooltip");
  
  t.select("#qtd").text(maps[0].get(element_id));
  t.select("#pop").text(state_population.get(element_id));
  t.select("#taxa").text(maps[1].get(element_id));
  t.select("#name_county").text(state_name_mapa.get(element_id));
  t.classed("hidden", false);
  const rect = t.node().getBoundingClientRect();
  const wi = rect.width;
  const hi = rect.height;
  if (x + offset + wi > w) {
    x = x - wi;
  }

  if (y - hi < 0){
    y = y + hi + offset*3;
  }
  t.style("left", x + offset + "px").style("top", y - hi + "px");
}

function hideTooltip(map){
  d3.select("#tooltip")
    .classed("hidden", true);
}

function createMap(){
  $("#Q12").empty();
  
  const maps = update_countStates(group_states);
  // const domain = [group_states.top(group_states.size())[group_states.size()-1].value,group_states.top(1)[0].value];
  //aqui
  let min= Number.MAX_VALUE, max = Number.MIN_VALUE;
  maps[1].forEach(function(d){
    if(d > max)
      max = d;
    if(d < min)
      min = d;
  });
  const domain = [min,max];
  const color_scheme = d3.schemeGreens[7];
  const values_variation = domain[1] - domain[0];
  colorScale_mapa = d3.scaleQuantile()
                    .domain([domain[0],domain[0] + (values_variation * 0.05),domain[0] + (values_variation * 0.1),domain[0] + (values_variation * 0.30),domain[0] + (values_variation * 0.5),domain[0] + (values_variation * 0.7),domain[1]])
                    .range(color_scheme);
  mapa = renderMap(brazil,maps);
  createLegend(color_scheme);
}



var data = d3.csv(path_empresas).then(function (data) {

  facts = crossfilter(data);
  dim_states = facts.dimension(d => d.state);
  group_states = dim_states.group();

  let dim_cnpj = facts.dimension(d=>d.cnpj);

  let nameMap = new Map();
  data.forEach(function(d) {
    nameMap.set(d.id, d.name)
  })

      

// Q12
d3.json(path_brazil).then(function(data2){

    const features = topojson.feature(data2, data2.objects.estados).features;
    features.forEach(function(d){
      state_name_mapa.set(d.id,d.properties.nome);
      state_population.set(d.id,d.properties.popula);
    });
    brazil = data2;
    createMap();
  });

// Q8
  runDimensionQ8 = facts.dimension(function(d) {return [+d.quantidade_socios, +d.total_capital]; });

  runGroup = runDimensionQ8.group();

  var symbolScale = d3.scaleLinear().domain([0, 100]);
 /* var symbolAccessor = function(d) { return symbolScale(d.key[0]); };
  var subChart = function(c) {
    return new dc.ScatterPlot(c)
        .symbol(symbolAccessor)
        .symbolSize(8)
        .highlightedSize(20)
  };
*/
  

    chartQ8.width((w / 3) * 1.0)
    .height(h / 3)
        .margins({top: 20, right: 20, bottom: 40, left: 30})
        .x(symbolScale)
        .brushOn(true)
        .symbolSize(8)
        .highlightedSize(20)
        .elasticY(true)
        ._rangeBandPadding(1)
        .clipPadding(10)
        .on("filtered", function(chart,filter){
              createMap()
        })
        .yAxisLabel("Total Capital")
        .xAxisLabel("Quantidade de Sócios")
        .dimension(runDimensionQ8)
        .group(runGroup)
        .colors(['#000'])

       

    


/*
 chartQ8.on("renderlet.chart", function(chart){
    chartQ8.selectAll('path.symbol').on('click',function(){alert("Teste");});
  });

chartQ8.on('pretransition', function(chart) {
        chartQ8.selectAll('text').text(function(d) {
            
        })
    })
    .on("filtered", function(chart,filter){
              createMap()
        });
*/
 
chartQ8.yAxis().tickFormat(function(d) {return d3.format(',d')(d+10000000000);});
  chartQ8.margins().left += 60;


  var qtds = 0;
   
  // Q7

    runDimensionQ7  = facts.dimension(function(d) { 
        qtds = d3.format(".2f")(d.quantidade_natureza_legal);
        return d.natureza_legal+"-"+qtds;
      })
        speedSumGroup = runDimensionQ7.group();

  chartQ7
    .width((w / 3) * 1.50)
    .height(h / 3)
    .slicesCap(7)
    .dimension(runDimensionQ7)
    .group(speedSumGroup)
    .legend(dc.legend().itemHeight(13).gap(5).highlightSelected(true))
   
    .on("filtered", function(chart,filter){
              createMap()
        });

chartQ7.on('pretransition', function(chart) {
      chartQ7.selectAll('.dc-legend-item text')
          .text('')
        .append('tspan')
          .text(function(d) { return d.name; })
        .append('tspan')
          .attr('text-anchor', 'start')
          .text(function(d) { return ''; });

          chartQ7.selectAll('text.pie-slice').text(function(d) {
                return dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%';
        })
  });
     
    // QTable
        
        var runDimension = facts .dimension(function(d) {return [d.empresa];}),
        experimentDimension = facts  .dimension(function(d) {return d.empresa;}),
        experimentGroup = experimentDimension.group().reduceCount();

        tabela
          .width(300)
          .height(480)
          .dimension(runDimension)
          .size(Infinity)
          .showSections(false)
          .columns([d=>"<a title='Ver rede de sócios' target='_blank' href='rede_socios.html?cnpj="+d.cnpj+"'>"+d.cnpj+"</a>", d => d.empresa, d => d.state, 
            d => d.natureza_legal, d => d.total_capital , d => d.quantidade_socios])
          .sortBy(function (d) { return [d.empresa]; })
          .order(d3.ascending)
          .on('preRender', update_offset)
          .on('preRedraw', update_offset)
          .on('pretransition', display);

     /*   tabela.width(w)
            .height(h)
            .dimension(dim_cnpj)
            .size(Infinity)
            .columns([d=>"<a title='Ver rede de sócios' href='rede_socios.html?cnpj="+d.cnpj+"'>"+d.cnpj+"</a>",d=>d.cnpj,d=>d.empresa,d=>d.state,d=>d.natureza_legal,d=>d.total_capital,d=>d.quantidade_socios])
            .sortBy(d=>d.cnpj)
            .order(d3.ascending)
            .on('preRender', update_offset)
            .on('preRedraw', update_offset)
            .on('pretransition', display);*/

  dc.renderAll();

  return data;


})

      function update_offset() {
          var totFilteredRecs = facts.groupAll().value();
          var end = ofs + pag > totFilteredRecs ? totFilteredRecs : ofs + pag;
          ofs = ofs >= totFilteredRecs ? Math.floor((totFilteredRecs - 1) / pag) * pag : ofs;
          ofs = ofs < 0 ? 0 : ofs;

          tabela.beginSlice(ofs);
          tabela.endSlice(ofs+pag);
      }
      function display() {
          var totFilteredRecs = facts  .groupAll().value();
          var end = ofs + pag > totFilteredRecs ? totFilteredRecs : ofs + pag;
          d3.select('#begin')
              .text(end === 0? ofs : ofs + 1);
          d3.select('#end')
              .text(end);
          d3.select('#last')
              .attr('disabled', ofs-pag<0 ? 'true' : null);
          d3.select('#next')
              .attr('disabled', ofs+pag>=totFilteredRecs ? 'true' : null);
          d3.select('#size').text(totFilteredRecs);
          if(totFilteredRecs != facts  .size()){
            d3.select('#totalsize').text("(Total: " + facts  .size() + " )");
          }else{
            d3.select('#totalsize').text('');
          }
      }
      function next() {
          ofs += pag;
          update_offset();
          tabela.redraw();
      }
      function last() {
          ofs -= pag;
          update_offset();
          tabela.redraw();
      }

