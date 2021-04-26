const  path_socios = path_data+"socios.csv";

// const  path_socios = path_data+"socios_min.csv";
var w = window.innerWidth;
var h = window.innerHeight;

const size = 1;

let g = new Map();
let g_inverse = new Map();
let cpnj_to_id = new Map();
let colorScale = d3.scaleOrdinal()
                 .domain(["Jurídico","Físico","Estrangeiro"])
                 .range(["#a83252", "#7846eb", "#f5a364"]);

function getComponent(id){
	let current_id = null;
	let nodes = [];
	let edges = [];
	let count_edges = 0;
	let next_list = [id];
	let visited_list = [];
	let label = ""
	while(next_list.length > 0){
		current_id = next_list.shift();
		console.log(current_id)
		if(g.has(current_id)){
			console.log("Foi")
			let neighbors = g.get(current_id);
			visited_list.push(current_id);
			// if(current_id)
			label = current_id;
			if(label.includes("-"))
				label = label.split("-")[1];
			if(label.includes(" "))
				label = label.split(" ")[0];
			let node = {'id':current_id,'label':label,'x':0,'y':0,'color':colorScale("Jurídico"),'size':size};
			nodes.push(node);
			neighbors.forEach(function(d){
				if(d[2] == "Físico" || d[2] == "Estrangeiro"){
					if(!visited_list.includes(d[1])){
						label = d[1];
						if(label.includes("-"))
							label = label.split("-")[1];
						if(label.includes(" "))
							label = label.split(" ")[0];
						let neighbor = {'id':d[1],'label':label,'x':0,'y':0,'color':colorScale(d[2]),'size':size};
						nodes.push(neighbor);
						visited_list.push(d[1]);


						if(g_inverse.has(d[1])){
							let parents2 = g_inverse.get(d[1]);
							parents2.forEach(function(d2){
								if(!visited_list.includes(d2) && !next_list.includes(d2)){
									next_list.push(d2);
								}
							});
						}
					}
				}
				else{
					if(!visited_list.includes(d[1]) && !next_list.includes(d[1])){
						next_list.push(d[1]);
					}
				}
				let edge = {'id':"e"+count_edges,'source':current_id,'target':d[1],'label':d[0],'type':'arrow','size': 10};
				edges.push(edge);
				count_edges+= 1;
				if (d[3] != ""){
					if(!visited_list.includes(d[3])){
						label = d[3]
						if(label.includes("-"))
							label = label.split("-")[1];
						if(label.includes(" "))
							label = label.split(" ")[0];
						let representant = {'id':d[3],'label':label,'x':0,'y':0,'color':colorScale("Físico"),'size':size};
						nodes.push(representant);
						visited_list.push(d[3]);


						if(g_inverse.has(d[3])){
							let parents3 = g_inverse.get(d[3]);
							parents3.forEach(function(d2_rep){
								if(!visited_list.includes(d2_rep) && !next_list.includes(d2_rep)){
									next_list.push(d2_rep);
								}
							});
						}
					}

					let edge_representant = {'id':"e"+count_edges,'source':d[1],'target':d[3],'label':d[4],'type':'arrow','size': 10};
					edges.push(edge_representant);
					count_edges+= 1;	
				}

			});
		}
		if(g_inverse.has(current_id)){
			let parents = g_inverse.get(current_id);
			parents.forEach(function(d){
				if(!visited_list.includes(d) && !next_list.includes(d)){
					next_list.push(d);
				}
			});
		}

	}
	let count = 0;
	nodes.forEach(function(d){
		d['x'] = 100 * Math.cos(2 * count * Math.PI / nodes.length);
		d['y']= 100 * Math.sin(2 * count * Math.PI / nodes.length);
		count+= 1;
	});
	return {'nodes':nodes,'edges':edges};
}
var component = null;
d3.csv(path_socios).then(function(data){
	data.forEach(function(d){
		//empresa,qualification,partner,type,representante,qualificacao_repr
		let cnpj = d.empresa.split("-")[0];
		if(!cpnj_to_id.has(cnpj))
			cpnj_to_id.set(cnpj,d.empresa)

		if(!g.has(d.empresa))
			g.set(d.empresa,[]);
		let edges = g.get(d.empresa);
		edges.push([d.qualification,d.partner,d.type,d.representante,d.qualificacao_repr]);


		if(d.type == "Jurídico"){
			if(!g.has(d.partner))
				g.set(d.partner,[]);
		}

		if(!g_inverse.has(d.partner))
			g_inverse.set(d.partner,[]);
		let edges_inverse = g_inverse.get(d.partner);
		edges_inverse.push(d.empresa);

		if(d.representante != ""){
			if(!g_inverse.has(d.representante))
				g_inverse.set(d.representante,[]);
			let edges_inverse_rep = g_inverse.get(d.representante);
			edges_inverse_rep.push(d.partner);
		}
	});


	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const cnpj = urlParams.get("cnpj");

	if(cnpj != null){
		if(cpnj_to_id.has(cnpj)){
			const id = cpnj_to_id.get(cnpj);
			component = getComponent(id);
			s = new sigma({
						  graph: component,
						  renderer: {
						    container: document.getElementById('rede'),
						    type: 'canvas'
						  },
						  settings: {
						  	edgeLabelSize: 'fixed',
						  	enableEdgeHovering: true,
						    edgeHoverColor: 'edge',
						    defaultEdgeHoverColor: '#f00',
						    edgeHoverSizeRatio: 2,
						    edgeHoverExtremities: true,
						    maxNodeSize: 20,
						    maxEdgeSize: 3,
						    defaultEdgeLabelSize: 16

						  }
					});
			// Start the ForceAtlas2 algorithm:
			s.bind('overNode', function(e) {
				e.data.node.label = e.data.node.id;
				e.target.refresh();
			});
			s.bind('outNode', function(e) {
				let label = e.data.node.id;
				if(label.includes("-"))
					label = label.split("-")[1];
				if(label.includes(" "))
					label = label.split(" ")[0];
				e.data.node.label = label;
				e.target.refresh();
			});
			s.startForceAtlas2({worker: true, barnesHutOptimize: false});
			window.setTimeout(function() {s.killForceAtlas2()}, 2000);
		}else{
			alert("CNPJ inválido");
		}
	}else{
		alert("Dê como entrada a variável cnpj");
	}
	
})


//rede_socios.html?cnpj=03683912 //interessante Pai
//rede_socios.html?cnpj=03717625 //Interessante Adm