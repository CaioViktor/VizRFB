// const  path_estabelecimentos = path_data+"estabelecimentos.csv";

const  path_socios = path_data+"socios_min.csv";
var w = window.innerWidth;
var h = window.innerHeight;
var colh = h/2;
var colw = (33/100) * w;

let format = d3.format(".2f");
let facts = null;
let resetar = null;

let rowchartQ5 = dc.rowChart("#Q5");
let piechartQ10 = dc.pieChart("#Q10");
let barchartQ52 = dc.barChart("#Q52");
let barchartQ6 = dc.barChart("#Q6");
let enterpriseDim = null
let enterpriseGroup = null


var dataset = d3.csv(path_socios).then(function (data) {

	data = data.slice(4000,30000)
	facts = crossfilter(data);

	enterpriseDim = facts.dimension(d => d.empresa);
	enterpriseGroup = enterpriseDim.group().reduceCount(d => d.partner);

	function getTopsGroup(source_group, n) {
	    return {
	        all: function () {
	            return source_group.top(n);
	        }
	    };
	}

	let sorted = enterpriseGroup.top(10)
	let names = sorted.map(d => d.key)

	ordinalScale = d3.scaleLinear().domain([0, enterpriseGroup.top(1)[0].value]);

	rowchartQ5.width(w/2)
	          .height(h/3)
	          .margins({top: 10, right: 50, bottom: 30, left: 40})
	          .dimension(enterpriseDim)
	          .group(enterpriseGroup)
	          .x(ordinalScale)
	          .elasticX(true)
	          .valueAccessor(d => d.value)
	          .othersGrouper(false)
	          .colors(['#3182bd'])
	          .cap(10)


	function remove_empty_bins(source_group) {
	    return {
	        all:function () {
	            return source_group.all().filter(function(d) {
	                //return Math.abs(d.value) > 0.00001; // if using floating-point numbers
	                return d.value !== 0; // if integers only
	            });
	        }
    	};
	}

	qualificationDim = facts.dimension(d => d.qualification.substring(0,50))
	qualificationGroup = remove_empty_bins(qualificationDim.group().reduceCount())

	var diferent_qual = new Set()
	data.forEach(function (d) {if (d.qualification != "") {diferent_qual.add(d.qualification);}})
	diferent_qual = Array.from(diferent_qual)

	colorScale = d3.scaleOrdinal()
                 .domain(diferent_qual)
                 .range(['#8dd3c7','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f','#bbc252','#bebada','#1f78b4','#b2df8a','#33a02c','#fb9a99','#73a37e'])

	piechartQ10.width(w/2)
	   		   .height(h/3)
			   .dimension(qualificationDim)
			   .group(qualificationGroup)
			   .slicesCap(5)
			   .colors(colorScale)
			   .legend(dc.legend())
			   .on('pretransition', function(chart) {
			        piechartQ10.selectAll('text.pie-slice').text(function(d) {
			            return dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100) + '%';
			        })
			    })
			   .on('renderlet', function(chart) {
			      chart.selectAll('rect').on('click', function(d) {
			         console.log('click!', d);
			      });
			   });


	let enterprise_numbers = sorted.map(d => d.key.split('-')[0])

	var xdim = facts.dimension(function (d) {return d.empresa.split('-')[0];});
  
	var ydim = xdim.group().reduce(
	  function(p, v) {
	    p[v.qualification] = (p[v.qualification] || 0) + 1;
	    // console.log(v)
	    // console.log(p)
	    return p;
	}, 
	  function(p, v) {
	    p[v.qualification] = (p[v.qualification] || 0) - 1;
	    return p;
	}, 
	  function() {
	    return {};
	  });

	function sel_stack(valueKey) {
		return function(d) {
		  	// console.log(d)
		    return d.value[valueKey];
		};
	}

	
	function getTops(source_group) {
		return {
		    all: function () {
		    	let top10 = []
		    	source_group.all().forEach(function(d){
		    		let total = 0;
		    		for(sub in d.value){
		    			total+= d.value[sub];
		    		}
		    		top10.push({'key':total,'value':d})
		    	})
		    	top10.sort(function(a,b){
		    		return  b['key'] - a['key'] ;
		    	})
		    	let top10v = []
		    	for(i=0;i<10;i++){
		    		top10v.push(top10[i].value);
		    	}
		        return top10v;
		    }
		};
	}

	var fakeGroup = getTops(ydim);
	let topEmpr = [];

	fakeGroup.all().forEach(function(d){
		topEmpr.push(d.key)
	})

	let ordinalScaleNumbers = d3.scaleOrdinal().domain(topEmpr)

	barchartQ52
			  .width(w/2)
			  .height(h/2)
			  .margins({left: 40, top: 20, right: 10, bottom: 40})
			  .brushOn(false)
			  .clipPadding(10)
			  .gap(10)
			  .title(function (d) {
			     return 'Empresa: ' + d.key + '\n' + this.layer + ': ' + d.value[this.layer];
			  })
			  //.yAxisLabel("Número de sócios")
			  .xAxisLabel("Empresa")
			  .elasticY(true)
			  //.x(d3.scaleLinear().domain([1, 10]))
			  .x(ordinalScaleNumbers)
			  .dimension(xdim)
			  .group(fakeGroup, diferent_qual[0], sel_stack(diferent_qual[0]))
			  .renderLabel(false)
			  .colors(colorScale)
			  .xUnits(dc.units.ordinal)
			  //.legend(dc.legend());
			  
			  for (var i = 1; i < diferent_qual.length; ++i) {
			     barchartQ52.stack(fakeGroup, '' + diferent_qual[i], sel_stack(diferent_qual[i]));
			  }


	remove_empty_values = (source_group) => {
	    return {
	        all: () => {
	            return source_group.all().filter(function(d) {
	                // here your condition
	                return d.key !== null && d.key !== '' && d.value !== 0; // etc. 
	            });
	        }
	    };
	}

	typeDim = facts.dimension(d => d.qualificacao_repr)
	typeGroup = typeDim.group().reduceCount(d => d.empresa)

	var diferent_types = new Set()
	data.forEach(function (d) {if (d.qualificacao_repr != "") {diferent_types.add(d.qualificacao_repr);}})
	ordinalScaleType = d3.scaleOrdinal().domain(Array.from(diferent_types))


	barchartQ6.width(w/2)
          .height(h/2)
          .margins({left: 40, top: 20, right: 350, bottom: 40})
          .gap(50)
          .dimension(enterpriseDim)
          .ordering(function(d) {return -d.value})
          .group(remove_empty_values(typeGroup))
          .x(ordinalScaleType)
          .centerBar(false)
          .elasticY(true)
          .xUnits(dc.units.ordinal);


	dc.renderAll();

	// function AddXAxis(chartToUpdate, displayText)
	// {
	//     chartToUpdate.svg()
	//                 .append("text")
	//                 .attr("class", "x-axis-label")
	//                 .attr("text-anchor", "middle")
	//                 .attr("x", chartToUpdate.width()/2)
	//                 .attr("y", chartToUpdate.height()+2)
	//                 .text(displayText);
	// }

	// AddXAxis(rowchartQ5, "Número de sócios");

	return data

});