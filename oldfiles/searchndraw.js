(function() {
var sets = [];
var overlaps = [];
var searches = [];
var search;
var index;
var myOverlap;
var mySet;
var mySearch;

  $("button").click(function(){
    //start fresh with each .click
    $(".venn").empty();
    searchstr = $("#search").val();
    while (sets.length) { sets.pop(); }
    while (searches.length) { searches.pop(); }
    while (overlaps.length) { overlaps.pop(); }
    startSearch(searchstr);
   });

function vennresults (searchterms, citenum) {
     if (typeof searchterms == "object") {
     var newsearchterms = searchterms.map(function(term) {
     return sets[term].label;
     });
     searchterms = newsearchterms.join(" AND ");
     }

     esearch(searchterms)
     .done(function( response ) {
     getDocs(response);
      });
}  


function setOverlap(slist, sresults) {
    this.sets = slist;
    this.size = Number(sresults);
}

function setSet(slabel, ssize) {
    this.label = slabel;
    this.size = Number(ssize);
}

function setSearch(sets, terms) {
    this.sets = sets;
    this.terms = terms;
}

function esearch(term) {
     return $.ajax({
	url: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
	data: {
	db: 'pubmed',
	usehistory: 'y',
	term: term,
	retmode: 'json',
	retmax: 0
	}
     });
}

function everythingDone() {
/*
txt = "<ol>"
for (index = 0; index < sets.length; index++) {
         txt += "<li>" + sets[index].label + " : " + sets[index].size + "</li>";
         //$("#sets").append("<li>" + txt + "</li>");	 
	 } 
txt += "</ol>";
document.getElementById("results").innerHTML = txt;

var txt2 = "<h2>Overlaps</h2><ol>";
for (index = 0; index < overlaps.length; index++) {
         txt2 += "<li>" + overlaps[index].sets + " : " + overlaps[index].size + "</li>";
        }    
txt2 += "</ol>";
document.getElementById("demo2").innerHTML = txt2;
*/
$( "#vennLoading" ).addClass( "hideMe" )
$( "#ztrigger" ).removeClass( "hideMe" )
drawVennDiagram () ;

}


function getOverlaps() {
var results;
var count;
$.each(searches, function (i, search) {
     esearch(searches[i].terms)
     .then(function( data ) {
     myOverlap = new setOverlap(searches[i].sets,data.esearchresult.count);    
     overlaps.push(myOverlap);
     if (overlaps.length == searches.length) {
         everythingDone();
      }          
     });   
    });
}

function getDocs(data) {
     var query_key = data.esearchresult.querykey;
     var WebEnv = data.esearchresult.webenv;
     var esummaryURL = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
     $("#translation").empty();
     $("#translation").append(data.esearchresult.querytranslation + ": " + data.esearchresult.count);
     $("#vennresults dl").empty(); 
     
     $.getJSON( esummaryURL, {
     db: 'pubmed',
     usehistory: 'y',
     WebEnv: WebEnv,
     query_key: query_key,
     retmode: 'json',
     retmax: '20'
     })
     .done(function( response ) {
     
     //result = response.result[25318114] instead of .dot notation -- probably should refactor this using $.each
     result = response.result;
     var uids = result.uids;
     var  i = 0;
     while (i < uids.length) {
         $("#vennresults dl").append("<dt>" + '<a href="http://www.ncbi.nlm.nih.gov/pubmed/' + result[uids[i]].uid + '">' + result[uids[i]].title + '</a></dt>');
	var names = [];
	var a = 0;
	while (a < result[uids[i]].authors.length) {
	     names.push(result[uids[i]].authors[a].name);
	     a++;
        }
        var cite = names.join(", "); 
	cite += "<br />" + result[uids[i]].source + ". " + result[uids[i]].pubdate
	if (result[uids[i]].volume) { cite += ";" + result[uids[i]].volume; } 
	if (result[uids[i]].issue) { cite += "(" + result[uids[i]].issue + ")"; } 
	if (result[uids[i]].pages) { cite += ":" + result[uids[i]].pages; } 
	cite += ".";
	 $("#vennresults dl").append("<dd>" + cite + "</dd>");
	i++;	
     }

      }); 
}

function startSearch(term) {
     $(".venn").empty();
     $( "#vennLoading" ).removeClass( "hideMe" )
     esearch(term) 
     .then(function( data ) {
        var numResults = Number(data.esearchresult.count);
	var translation = data.esearchresult.querytranslation;
	if (numResults == 0) { 
		$("#vennLoading").addClass("hideMe"); 
		
		document.getElementById("translation").innerHTML = '<div class="alert alert-danger" role="alert">Nothing found for this search. Please try again</div>.';
		} else if (data.esearchresult.translationset.length < 1) {
		//do something to telll them there's no drawing coming...
		$("#vennLoading").empty();
		$("#vennLoading").append("<p>Only one term found. No diagram shown...</p>"); 		
	} else {
		//document.getElementById("translation").innerHTML = "<p>Pubmed translated your search to :" + translation + "</p>";
		//$("#translation").append("<p>" + numResults + " citations were found</p>"); 
	}

	$.each( data.esearchresult.translationstack, function( i, item ) {
		if(typeof item == "object") { 
			mySet = new setSet(item.term, item.count);  
			sets.push(mySet);
	}	    
});

for (index = 0; index < sets.length; index++) {
     for (j = index; j < (sets.length - 1); j++) {
         search = sets[index].label + " AND " + sets[j+1].label
	 //send sets and terms to our temporary 'search' object
	 mySearch = new setSearch([index,(j+1)], search);  
         searches.push(mySearch);	 
       }    
   }

getDocs(data);
getOverlaps();

}).fail(function() {
    alert("Search failed");
});
}

//trigger zoom
  $("#ztrigger").click(function(){
  $( "#ztrigger" ).addClass( "hideMe" )
       var nukeviewbox = d3.select("svg")
       .attr("viewbox",null)
       .attr("width","500")
       .attr("height","500");    
  
        svgPanZoom('#venn', {
          zoomEnabled: true,
          controlIconsEnabled: true,
          fit: true,
          center: true
   });
    });   

function drawVennDiagram () {

// get positions for each set
sets = venn.venn(sets, overlaps);

// draw the diagram in the 'venn' div
var diagram = venn.drawD3Diagram(d3.select(".venn"), sets, 500, 500);

// add a tooltip showing the size of each set/intersection
var tooltip = d3.select("body").append("div")
    .attr("class", "venntooltip");

d3.selection.prototype.moveParentToFront = function() {
  return this.each(function(){
    this.parentNode.parentNode.appendChild(this.parentNode);
  });
};

var setid = d3.select("svg").attr("id","venn");    

// hover on all the circles
diagram.circles
    .style("stroke-opacity", 0)
    .style("stroke", "white")
    .style("stroke-width", "2");

diagram.nodes
    .on("mousemove", function() {
        tooltip.style("left", (d3.event.pageX) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseover", function(d, i) {
        var selection = d3.select(this).select("circle");
        selection.moveParentToFront()
            .transition()
            .style("fill-opacity", .5)
            .style("stroke-opacity", 1);

        tooltip.transition().style("opacity", .9);
        tooltip.text(d.size + " citations");
    })
    .on("mouseout", function(d, i) {
        d3.select(this).select("circle").transition()
            .style("fill-opacity", .3)
            .style("stroke-opacity", 0);
        tooltip.transition().style("opacity", 0);
    })
     .on("click", function(d, i) {
        vennresults(d.label, d.size);
    });

// draw a path around each intersection area, add hover there as well
diagram.svg.selectAll("path")
    .data(overlaps)
    .enter()
    .append("path")
    .attr("d", function(d) { 
        return venn.intersectionAreaPath(d.sets.map(function(j) { return sets[j]; })); 
    })
    .style("fill-opacity","0")
    .style("fill", "black")
    .style("stroke-opacity", 0)
    .style("stroke", "white")
    .style("stroke-width", "2")
    .on("mouseover", function(d, i) {
        d3.select(this).transition()
            .style("fill-opacity", .1)
            .style("stroke-opacity", 1);
        tooltip.transition().style("opacity", .9);
        tooltip.text(d.size + " citations");
	})
    .on("mouseout", function(d, i) {
        d3.select(this).transition()
            .style("fill-opacity", 0)
            .style("stroke-opacity", 0);
        tooltip.transition().style("opacity", 0);
    })
    .on("mousemove", function() {
        tooltip.style("left", (d3.event.pageX) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("click", function(d, i) {
	vennresults(d.sets, d.size);
    })

}


})
();