export default {
	user: {
		isAuthenticated: false,
	},
	isLoading: true,
	savedLinks: {
		status: 'isLoading',
		links: [{url: 'https://www.google.com', label: 'Google'},
				{url: 'https://www.facebook.com', label: 'Facebook'}]
	},
	savedEntities: {
		status: 'isLoading',
		entities: [
			{id: 0, name: 'Alice Ma', type: 'Person', tags: ['Daryus Medora'], sources: [], projects: [0, 1], qid: ""}, 
			{id: 1, name: 'Daryus Medora', type: 'Person', tags: ['Alice Ma'], sources: [], projects: [0], qid: ""}, 
			]
	},
  pendingEntities: {
    status: 'isLoading',
    entities: [
      {id: 2, name: 'Angelina Wang', type: 'Person', tags: [], sources: [], connections: [], projects: [1], qid: ""}
    ]
  },
	savedSources: {
		status: 'isLoading',
		documents: [
		]
	},
	savedVertices: {
		status: 'isLoading',
		vertices: []
	},
  savedSearchItems:{
    status:'isLoading',
    searchItems: []
  },
	entityTypes: ["Company", "Person", "Location"],
	entityNames: ["Alice Ma", "Daryus Medora", "Angelina Wang"],
	projects: [
		{id: 0, title: 'Venezuela Sanctions 24 Aug 2017', owner: 'Anjali Banerjee', lastAction: 'No latest activity.', entities: [0, 1]},
		{id: 1, title: 'Syria Archive Project', owner: 'Haley', lastAction: 'No latest activity.', entities: [0, 2]}
	],
	savedProjects: {
		status: 'isLoading',
    projects: []
	},
  savedArcherNodes: {
    status: 'isLoading',
    nodes: []
  },
  currentProject: {_id: 0, name: "Sample"}
}