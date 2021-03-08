const  path_estabelecimentos = path_data+"estabelecimentos.csv";
var w = window.innerWidth-100;
var h = window.innerHeight/2;
let next,last;
format = d3.format(".2f")



d3.csv(path_estabelecimentos).then(function(data){
	//root_cnpj,cnpj_est,name,porte,date_start,situation,situationDate,state
	let parseDate = d3.utcParse("%Y-%m-%d");
	data.forEach(function(d){
		d.date_start = parseDate(d.date_start);
		d.situationDate = parseDate(d.situationDate);
	});
	
	let lineChartQ11 = dc.lineChart("#Q11_linechart");
	let data_table = dc.dataTable("#table_estabs");
	let barchart= dc.barChart("#Q3");
	// let lineChartF = dc.lineChart("#fechados");


	let facts = crossfilter(data);


	//Q11
	let dim_date_start = facts.dimension(d=>d.date_start);
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
	let hourScale = d3.scaleTime().domain(d3.extent(data,d=> d.date_start))

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
	        .title(function(d) { return 'Dia: ' + d.key+'\nAcumulado: '+ d.value+'\nNo dia: '+d.in_day; })
            .brushOn(false)
            .mouseZoomable(true);





    //Q3
    let dim_porte = facts.dimension(function(d){ return d.porte});
    let situacoes = ["Ativa","Baixada","Inapta","Nula"];
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
		// console.log(candidatosGroup);
		function sel_stack(i) {
              return function(d) {
                	return d.value[i];
              };
          	}

    let colorScale = d3.scaleOrdinal()
                 .domain(["Ativa","Baixada","Inapta","Nula"])
                 .range(["#4daf4a", "#e41a1c", "#984ea3","#377eb8"])

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
    for (var i = 1; i < 4; ++i) {
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
            .columns([d=>d.root_cnpj,d=>d.cnpj_est,d=>d.name,d=>d.porte,d=>d.date_start,d=>d.situation,d=>d.situationDate,d=>d.state])
            .sortBy(d=>d.root_cnpj)
            .order(d3.ascending)
            .on('preRender', update_offset)
          	.on('preRedraw', update_offset)
          	.on('pretransition', display);





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