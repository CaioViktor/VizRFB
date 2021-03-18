// const  path_estabelecimentos = path_data+"estabelecimentos.csv";

const  path_estabelecimentos = path_data+"estabelecimenos_min.csv";
var w = window.innerWidth-100;
var h = window.innerHeight/2;
let next,last;
format = d3.format(".2f")



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