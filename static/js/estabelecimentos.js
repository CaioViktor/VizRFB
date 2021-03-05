const  path_estabelecimentos = path_data+"estabelecimentos.csv";
var w = window.innerWidth-100;
var h = window.innerHeight/2;

d3.csv(path_estabelecimentos).then(function(data){
	//root_cnpj,cnpj_est,name,date_start,situation,state
	let parseDate = d3.utcParse("%Y-%m-%d");
	data.forEach(function(d){
		d.date_start = parseDate(d.date_start);
	});
	
	let lineChartQ11 = dc.lineChart("#Q11_linechart");
	let data_table = dc.dataTable("#table_estabs");


	let facts = crossfilter(data);



	let dim_date_start = facts.dimension(d=>d.date_start);
	let group_date_start = dim_date_start.group();
	let hourScale = d3.scaleTime().domain(d3.extent(data,d=> d.date_start))

	lineChartQ11.width(w)
            .height(h)
            .margins({top: 10, right: 10, bottom: 20,left:30})
            .dimension(dim_date_start)
            .group(group_date_start)
            .x(hourScale)
            .renderArea(false)
            .brushOn(true);



    let dim_cnpj = facts.dimension(d=>d.cnpj_est);
    data_table.width(w)
            .height(h)
            .dimension(dim_cnpj)
            .size(5)
            .columns([d=>d.root_cnpj,d=>d.cnpj_est,d=>d.name,d=>d.date_start,d=>d.situation,d=>d.state])
            .sortBy(d=>d.root_cnpj)
            .order(d3.ascending);
           
  dc.renderAll()
});