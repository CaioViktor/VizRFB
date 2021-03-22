// const  path_estabelecimentos = path_data+"estabelecimentos.csv";

const  path_estabelecimentos = path_data+"estabelecimenos_min.csv";
const  path_brazil = path_data+"brazil.json";
var w = window.innerWidth-100;
var h = window.innerHeight/2;
let mapa = null;
let next,last;
let colorScale_mapa = null;
let state_name_mapa = new Map();
let format = d3.format(".2f")

function renderMap(data,map){
	const width = w;
	const height = h*2;
	const svg = d3.select("#Q1").append("svg");


	var projection =  d3.geoMercator()
					  .scale(600)
					  .center([-52, -17]);
	  // .translate([width / 2 + 18, height / 2 + 20]);

	path = d3.geoPath().projection(projection);



	svg.attr("width",w)
		.attr("height",h);

	svg.append("g")
	  .attr("class", "states")
	.selectAll("path")
	  .data(topojson.feature(data, data.objects.estados).features)
	.enter().append("path")
	  .attr("fill", d => colorScale_mapa(map.get(d.id)))
	  // .attr("fill", "blue")
	  .attr("d", path)
	  .attr("element_id",d=>d.id)
	  .on("mouseover", function(d){
	    d3.select(this) // seleciona o elemento atual
	    .style("cursor", "pointer") //muda o mouse para mãozinha
	    .attr("stroke-width", 3)
	    .attr("stroke","#FFF5B1");
	    
	    const rect = this.getBoundingClientRect();
	    showTooltip(map,this.getAttribute("element_id"), rect.x, rect.y);
	  })
	.on("mouseout", function(d){
	    d3.select(this)
	    .style("cursor", "default")
	    .attr("stroke-width", 0)
	    .attr("stroke","none"); //volta ao valor padrão

	    hideTooltip(map);
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
	      .html("<h4 id='name_county'></h4>Quantidade de estabelecimentos: <span id='taxa'></span>")

	// Once we append the vis elments to it, we return the DOM element for Observable to display above.
	return svg.node()
}

function update_countStates(group){
	let map = new Map();
	let states = group.all();
	states.forEach(function(d){
		map.set(d.key,+d.value);
	});
	return map;
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
			d3.format("d")(fromto[0]) + (d3.format("d")(fromto[1]) ? '&ndash;' + d3.format("d")(fromto[1]) : '+'));
	}

	div.innerHTML = labels.join('<br>')
	
  	$("#Q1").append(div);
}

function showTooltip(map,element_id, x, y) {
	const offset = 10;
	const t = d3.select("#tooltip");
	
	t.select("#taxa").text(map.get(element_id));
	t.select("#name_county").text(state_name_mapa.get(element_id));
	t.classed("hidden", false);
	const rect = t.node().getBoundingClientRect();
	const wi = rect.width;
	const hi = rect.height;
	if (x + offset + wi > w) {
		x = x - wi;
	}
	t.style("left", x + offset + "px").style("top", y - hi + "px");
}

function hideTooltip(map){
	d3.select("#tooltip")
		.classed("hidden", true);
}

var data = d3.csv(path_estabelecimentos).then(function(data){
	//root_cnpj,cnpj_est,name,date_start,situation,situationDate,state,porte,activity
	let parseDate = d3.utcParse("%Y-%m-%d");
	data.forEach(function(d){
		d.date_start_month = parseDate(d.date_start.substr(0,7)+"-02");
		d.date_start = parseDate(d.date_start);
		d.situationDate_month = parseDate(d.situationDate.substr(0,7)+"-02");
		d.situationDate = parseDate(d.situationDate);
	});
	
	let lineChartQ11 = dc.lineChart("#Q11_linechart");
	let data_table = dc.dataTable("#table_estabs");
	let barchart= dc.barChart("#Q3");
	let lineChart_situation = dc.seriesChart("#situacoes_linha");
	let rowChartQ2 = dc.rowChart("#Q2");


	let facts = crossfilter(data);



	//Q1
	var brazil = d3.json(path_brazil).then(function(data2){
		
		const features = topojson.feature(data2, data2.objects.estados).features;
		features.forEach(function(d){
			state_name_mapa.set(d.id,d.properties.nome);
		});

		let dim_states = facts.dimension(d => d.state);
		let group_states = dim_states.group();
		let map = update_countStates(group_states);
		const domain = [group_states.top(group_states.size())[group_states.size()-1].value,group_states.top(1)[0].value];
		const color_scheme = d3.schemeGreens[7];
		colorScale_mapa = d3.scaleQuantile()
			                .domain([domain[0],domain[0] + 20 * 1,domain[0] + 20 * 2,domain[0] + 20 * 3,domain[0] + 20 * 4,domain[0] + 20 * 5,domain[1]])
			                .range(color_scheme);
		mapa = renderMap(data2,map);
		createLegend(color_scheme);
		return data2;
	});


	//Q11
	let dim_date_start = facts.dimension(d=>d.date_start_month);
	let _group = dim_date_start.group().reduceSum(function(d){return 1});
	var group_date_start = {
		all:function () {
			var cumulate = 0;
			var g = [];
			_group.all().forEach(function(d,i) {
				cumulate += d.value;
				g.push({key:d.key,value:cumulate,'in_day':d.value})
			});
			return g;
		}
	};
	let hourScale = d3.scaleTime().domain(d3.extent(data,d=> d.date_start_month))

	lineChartQ11.width(w)
            .height(h)
 				.margins({left: 80, top: 20, right: 10, bottom: 40})
            .dimension(dim_date_start)
            .group(group_date_start)
            .x(hourScale)
            .renderArea(true)
            .yAxisLabel("Quantidade de estabelecimentos")
	        .xAxisLabel("Ano de início das atividades")
	        .clipPadding(10)
	        .elasticY(true)
	        .title(function(d) { return 'Data: ' + d.key+'\nAcumulado: '+ d.value+'\nNo mês: '+d.in_day; })
            .brushOn(false)
            .mouseZoomable(true);





    //Q3
    let dim_porte = facts.dimension(function(d){ return d.porte});
    let situacoes = ["Ativa","Baixada","Inapta","Nula","Suspensa"];
    barchart.ordering(function(d){
    	let cont = 0;
    	for(i in d.value) {
    		cont+= d.value[i];
    	}
    	return -cont;
    });

    let group_porte_situacao = dim_porte.group().reduce(function(p,v){
			//Add
			p[v.situation] = (p[v.situation] || 0) + 1;
			return p;
		},function(p,v){
			//Remove
			p[v.situation] = (p[v.situation] || 0) - 1;
			return p;
		},function(p,v){
			//Init
			return {};
		});
		
		function sel_stack(i) {
              return function(d) {
                	return d.value[i];
              };
          	}

    let colorScale = d3.scaleOrdinal()
                 .domain(["Ativa","Baixada","Inapta","Nula","Suspensa"])
                 .range(["#4daf4a", "#e41a1c", "#984ea3","#377eb8","#0dfeb9"])

    barchart.width(768)
                .height(480)
                .x(d3.scaleLinear().domain([1, 21]))
                .margins({left: 80, top: 20, right: 10, bottom: 40})
                .brushOn(false)
                .clipPadding(20)
                .gap(40)
                .yAxisLabel("Quantidade de estabelecimentos")
	        	.xAxisLabel("Porte")
                .title(function (d) {
                	let total = 0
                	for (i in d.value){
                		total += d.value[i];
                	}
                	let rate = format((d.value[this.layer]/ total) * 100);
                    return d.key + '[' + this.layer + ']: ' + d.value[this.layer]+"\n"+rate+"%";
                })
                .x(d3.scaleBand())
            	.xUnits(dc.units.ordinal)
                .dimension(dim_porte)
                .group(group_porte_situacao, situacoes[0], sel_stack(situacoes[0]))
                .renderLabel(true)
                .colors(colorScale);

    barchart.legend(dc.legend());
    for (var i = 1; i < 5; ++i) {//TODO:Ver porque está dando erro ao colocar as 5 situações no completo
                barchart.stack(group_porte_situacao, '' + situacoes[i], sel_stack(situacoes[i]));
	}

    let dim_cnpj = facts.dimension(d=>d.cnpj_est);


    //Datatable
    var ofs = 0, pag = 17;

	function update_offset() {
	  var totFilteredRecs = facts.groupAll().value();

	  var end = ofs + pag > totFilteredRecs ? totFilteredRecs : ofs + pag;
	  ofs = ofs >= totFilteredRecs ? Math.floor((totFilteredRecs - 1) / pag) * pag : ofs;
	  ofs = ofs < 0 ? 0 : ofs;


	  data_table.beginSlice(ofs);
	  data_table.endSlice(ofs+pag);
	}

	function display() {
	  var totFilteredRecs = facts.groupAll().value();
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
	  if(totFilteredRecs != facts.size()){
	    d3.select('#totalsize').text("(filtered Total: " + facts.size() + " )");
	  }else{
	    d3.select('#totalsize').text('');
	  }
	}

	next=function(){
		ofs += pag;
		update_offset();
		data_table.redraw();
	}

	last=function(){
		ofs -= pag;
		update_offset();
		data_table.redraw();
	}

    data_table.width(w)
            .height(h)
            .dimension(dim_cnpj)
            .size(pag)
            .columns([d=>d.root_cnpj,d=>d.cnpj_est,d=>d.name,d=>d.porte,d=>d.date_start.toLocaleDateString(),d=>d.situation,d=>d.situationDate.toLocaleDateString(),d=>d.state,d=>d.activity])
            .sortBy(d=>d.root_cnpj)
            .order(d3.ascending)
            .on('preRender', update_offset)
          	.on('preRedraw', update_offset)
          	.on('pretransition', display);





    
           
    //Gráfico de linha das situações
    //TODO: Ver porque está dando erro ao filtrar
	let dim_situation = facts.dimension(d=>[d.situation,d.situationDate_month]);
	let _group_situation = dim_situation.group().reduceSum(function(d){return 1});

	
	var group_situation = {
		all:function () {
			var cumulate = {};
			var g = [];
			_group_situation.all().sort(function(a,b){
				var a_m = a.key[1].getMonth();
				if(a_m < 10){
					a_m = "0"+a_m 
				}
				var b_m = b.key[1].getMonth();
				if(b_m < 10){
					b_m = "0"+b_m 
				}
				if ((a.key[0]+a.key[1].getFullYear()+a_m) > (b.key[0]+b.key[1].getFullYear()+b_m)) 
					return 1; 
				else return -1
			}
				).forEach(function(d,i) {
				if(!(d.key[0] in cumulate))
					cumulate[d.key[0]] = d.value;
				else
					cumulate[d.key[0]] += d.value;
				g.push({key:d.key,value:cumulate[d.key[0]],'in_day':d.value})
			});
			return g;
		}
	};
	let hourScale_situation = d3.scaleTime().domain(d3.extent(data,d=> d.situationDate_month))


	lineChart_situation.width(w)
     .height(h)
     .chart(function(c) { return new dc.LineChart(c); })
     .x(hourScale_situation)
     .brushOn(false)
     .yAxisLabel("Quantidade acumulada de estabelecimentos")
     .xAxisLabel("Data da situação")
     .clipPadding(10)
     .elasticY(true)
     .dimension(dim_situation)
     .group(group_situation)
     .mouseZoomable(true)
     .seriesAccessor(function(d) { return d.key[0];})
     .keyAccessor(function(d) {return d.key[1];})
     .valueAccessor(function(d) { return +d.value;})
     .colors(colorScale)
     .legend(dc.legend().x(250).y(0).itemHeight(13).gap(5))
     .xAxis().ticks(5);










     //Gráfico de Q2
     let dim_atividades = facts.dimension(d => d.activity);
     let group_atividades = dim_atividades.group();
     let scaleAtividades = d3.scaleLinear().domain([0,group_atividades.top(1)[0].value]);
     rowChartQ2.ordering(function(d){return -d.value});


     rowChartQ2.width(w)
		.height(h)
		.dimension(dim_atividades)
		.group(group_atividades)
		.x(scaleAtividades)
		// .label(function(d){return d.key;})
		.margins({top: 50, right: 50, bottom: 25, left: 40})
		.elasticX(true)
		.valueAccessor(function(d) { return +d.value;})
		.othersGrouper(false)
		.colors(['#0d6efd'])
		.cap(10);

  dc.renderAll()
  return data;
});