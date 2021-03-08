const  path_estabelecimentos = path_data+"estabelecimentos.csv";
var w = window.innerWidth-100;
var h = window.innerHeight/2;
let next,last;


d3.csv(path_estabelecimentos).then(function(data){
	//root_cnpj,cnpj_est,name,porte,date_start,situation,situationDate,state
	let parseDate = d3.utcParse("%Y-%m-%d");
	data.forEach(function(d){
		d.date_start = parseDate(d.date_start);
		d.situationDate = parseDate(d.situationDate);
	});
	
	let lineChartQ11 = dc.lineChart("#Q11_linechart");
	let data_table = dc.dataTable("#table_estabs");


	let facts = crossfilter(data);



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
            .margins({top: 10, right: 10, bottom: 50,left:50})
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



    let dim_cnpj = facts.dimension(d=>d.cnpj_est);

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
           
  dc.renderAll()
});