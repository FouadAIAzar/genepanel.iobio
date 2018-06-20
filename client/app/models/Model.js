const x2js = require('x2js');

export default class Model {
  constructor() {
  this.x2js = new x2js();
  this.mergedGenes = null;
  this.selectedGenes = null;
}

  sumGenesBasedOnModeOfInheritance(items) {
    var obj ={};
    items.map(x=> {
      if(obj[x._modeOfInheritance]===undefined){
        obj[x._modeOfInheritance] = x._geneCount;
      }
      else if(obj[x._modeOfInheritance]!== undefined){
        obj[x._modeOfInheritance] = obj[x._modeOfInheritance]+x._geneCount;
      }
    });

    var newArr = [];
    for(var i in obj){
      newArr.push(
        {
          _modeOfInheritance: i,
          _geneCount:obj[i],
          selected: true
        }
      )
    }
    return newArr
  }

  filterItemsForModeOfInheritance(items){
    var arr =[];
    var obj= {};
    var tempArr = [];
    items.map(x=> {
      if(x._modeOfInheritance===""){
        arr.push({_modeOfInheritance:"Not provided", _geneCount: x._geneCount})
      }
      else if(x._modeOfInheritance.includes(",")) {
         tempArr = x._modeOfInheritance.split(", ");
         tempArr.map(y=> {
           arr.push({_modeOfInheritance: y, _geneCount: x._geneCount})
         });
         tempArr = [];
      }
      else {
        arr.push(x)
      }
    });
     return this.sumGenesBasedOnModeOfInheritance(arr);
  }

  filterItemsForDisorderNames(items){
    var disorderNames = [];
    items.map(x=>{
      disorderNames.push(x.Title);
    })
    return disorderNames;
  }

  promiseGetDiseases(searchTerm) {
  var me = this;
  return new Promise(function(resolve, reject) {



    var searchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=medgen"
                    + '&usehistory=y&retmode=json'
                    + '&term='
                    + '(((' + searchTerm +'[title]) AND "in gtr"[Filter])) AND (("conditions"[Filter] OR "diseases"[Filter]))';



    $.ajax( searchUrl )
    .done(function(data) {

      if (data["esearchresult"]["ERROR"] != undefined) {
        msg = "disease search error: " + data["esearchresult"]["ERROR"];
        reject(msg);
      } else {
        var webenv = data["esearchresult"]["webenv"];
        var queryKey = data["esearchresult"]["querykey"];

        var summaryUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gtr" + "&query_key=" + queryKey + "&WebEnv=" + webenv + "&usehistory=y"

        $.ajax( summaryUrl )
        .done(function(data) {
          if (data.childNodes.length < 2) {
            if (data.esummaryresult && data.esummaryresult.length > 0) {
              sumData.esummaryresult.forEach( function(message) {
              });
            }
            resolve({'searchTerm': searchTerm, 'diseases': []})
          } else {
            var results = me.x2js.xml2js(data.childNodes[1].innerHTML);
            if (results.ERROR) {
              if (results.ERROR == 'Empty result - nothing todo') {
                resolve({'searchTerm': searchTerm, 'diseases': []});
              } else {
                reject("Unable to parse disease summary results." + results.ERROR);
              }
            } else {
              var diseases = results.DocumentSummarySet.DocumentSummary;
              resolve({'searchTerm': searchTerm, 'diseases': Array.isArray(diseases) ? diseases : [diseases]});
            }
          }
        })
        .fail(function() {
          var msg = "Error in medgen disease summary. ";
          reject(msg);
        })
      }

    })
    .fail(function(data) {
        var msg = "Error in medgen disease search. ";
        reject(msg);
    })

  })

}

promiseGetGenePanels(disease) {
  var me = this;
  return new Promise(function(resolve, reject) {



    var searchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gtr"
                    + '&usehistory=y&retmode=json'
                    + '&term='
                    +  disease.ConceptId +'[DISCUI]';

    $.ajax( searchUrl )
    .done(function(data) {

      if (data["esearchresult"]["ERROR"] != undefined) {
        msg = "gene panel search error: " + data["esearchresult"]["ERROR"];
        reject(msg);
      } else {
        var webenv = data["esearchresult"]["webenv"];
        var queryKey = data["esearchresult"]["querykey"];

        var summaryUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gtr" + "&query_key=" + queryKey + "&retmode=json&WebEnv=" + webenv + "&usehistory=y"
        $.ajax( summaryUrl )
        .done(function(sumData) {

          if (sumData.result == null) {
            if (sumData.esummaryresult && sumData.esummaryresult.length > 0) {
              sumData.esummaryresult.forEach( function(message) {
              });
            }
            resolve({'disease': disease, 'genePanels': []})
          } else {
            var genePanels = [];
            for (var key in sumData.result) {
              if (key != 'uids') {
                genePanels.push(sumData.result[key]);
              }
            }
            resolve({'disease': disease, 'genePanels': genePanels});
          }
        })
        .fail(function() {
          var msg = "Error in gtr summary. ";
          console.log(msg);
          reject(msg);
        })
      }

    })
    .fail(function(data) {
        var msg = "Error in gtr search. ";
        console.log(msg)
        reject(msg);
    })

  })

}


processGenePanelData(genePanels) {
  var me = this;

  genePanels.forEach(function(genePanel) {

    genePanel._genes = genePanel.analytes
    .filter(function(analyte) {
      return analyte.analytetype.toUpperCase() == 'GENE';
    });

    genePanel._geneNames = genePanel._genes.map(function(gene,idx) {
      return gene.name;
    })
    .join(" ");

    genePanel._conditionNames = genePanel.conditionlist.map(function(condition) {
      return condition.name;
    })
    .join(", ");

  })

  var filteredGenePanels = genePanels.filter(function(genePanel) {
    return genePanel._genes.length > 0;
  });

  return filteredGenePanels

}



processDiseaseData(diseases) {
  var me = this;
  var filteredDiseases = diseases.filter(function(disease) {
    return disease.genePanels.length > 0;
  })

  let rowNumber = 1;
  filteredDiseases.forEach(function(disease) {
    disease._rowNumber = rowNumber++;
    disease._genePanelCount = disease.genePanels.length;


    var mergedGenes = me.mergeGenesAcrossPanels(disease.genePanels);
    disease._geneCount = mergedGenes.length;
    disease._geneNames = mergedGenes.map(function(gene) {
      return gene.name;
    })
    .join(" ")

    disease._omim = (disease.ConceptMeta && disease.ConceptMeta.OMIM && disease.ConceptMeta.OMIM.MIM) ? disease.ConceptMeta.OMIM.MIM : "";

    disease._modeOfInheritance = "";
    if (disease.ConceptMeta && disease.ConceptMeta.ModesOfInheritance) {
      for (var key in disease.ConceptMeta.ModesOfInheritance) {
        if (key == 'ModeOfInheritance') {
          var modes = Array.isArray(disease.ConceptMeta.ModesOfInheritance[key]) ? disease.ConceptMeta.ModesOfInheritance[key] : [disease.ConceptMeta.ModesOfInheritance[key]];
          modes.forEach(function(mode) {
            if (disease._modeOfInheritance.length > 0) {
              disease._modeOfInheritance += ", ";
            }
            disease._modeOfInheritance += mode.Name;
          })
        }
      }
    }
  })
  return filteredDiseases;
}


getGenePanelVendors(genePanels) {
  let vendors = {};
  genePanels.forEach(function(gp) {
    vendors[gp.offerer] = true;
  })

  return Object.keys(vendors).sort();
}


mergeGenePanelsAcrossDiseases(diseases) {
  var me = this;
  var genePanelMap = {};
//Find a way to pass the search terms here...
  diseases.forEach((disease)=> {
    disease.genePanels.forEach((genePanel)=> {
      genePanel["searchTerm"] = disease.searchTerm;
      genePanel["searchTermArray"] = disease.searchTermArray;
      genePanel["searchTermIndex"] = disease.searchTermIndex;
      genePanel["_uid"] = disease._uid;
      genePanel["disease"] = disease

    })
  })

  var diseaseTempArr = [];
  diseases.forEach((disease)=> {
    disease.genePanels.forEach((genePanel)=> {
      diseaseTempArr.push(genePanel)
    })
  })

  for(var i=0; i<diseaseTempArr.length; i++){
    for(var j=diseaseTempArr.length-1; j>i; j--){
      if(diseaseTempArr[i].id ===diseaseTempArr[j].id){
        diseaseTempArr[i].searchTermArray = [...diseaseTempArr[i].searchTermArray, ...diseaseTempArr[j].searchTermArray];
        diseaseTempArr[i].searchTermIndex = [...diseaseTempArr[i].searchTermIndex, ...diseaseTempArr[j].searchTermIndex];
        diseaseTempArr[i].searchTermArray = Array.from(new Set(diseaseTempArr[i].searchTermArray))
        diseaseTempArr[i].searchTermIndex = Array.from(new Set(diseaseTempArr[i].searchTermIndex))

      }
    }
  }

  diseaseTempArr.forEach((genePanel)=>{
    var theGenePanel = genePanelMap[genePanel.id];
    if (theGenePanel == null) {
      genePanel._diseases = {};
      theGenePanel = genePanel;
      genePanelMap[genePanel.id] = theGenePanel;
    }
    theGenePanel._diseases[genePanel._uid] = genePanel.disease;
  })

  // diseases.forEach(function(disease) {
  //   disease.genePanels.forEach(function(genePanel) {
  //     // console.log("genePanel", genePanel)
  //
  //     // genePanel["searchTerm"] = disease.searchTerm;
  //     // genePanel["searchTermArray"] = disease.searchTermArray;
  //     // genePanel["searchTermIndex"] = disease.searchTermIndex;
  //     // console.log("genePanel", genePanel.id)
  //     var theGenePanel = genePanelMap[genePanel.id];
  //     if (theGenePanel == null) {
  //       genePanel._diseases = {};
  //       theGenePanel = genePanel;
  //       genePanelMap[genePanel.id] = theGenePanel;
  //       // console.log("theGenePanel", theGenePanel.id)
  //       // console.log("theGenePanel searchTermArray", theGenePanel.searchTermArray)
  //       //combine search terms here..
  //     }
  //
  //     theGenePanel._diseases[disease._uid] = disease;
  //   })
  // })





  var mergedGenePanels = [];
  for (var key in genePanelMap) {
    var genePanel = genePanelMap[key];
    genePanel._diseaseNames = me.hashToSimpleList(genePanel._diseases, "Title", ", ");
    genePanel._diseaseCount = Object.keys(genePanel._diseases).length;
    genePanel._rowNumber = mergedGenePanels.length+1;
    mergedGenePanels.push(genePanel);
  }
  return mergedGenePanels;
}



mergeGenesAcrossPanels(genePanels) {
    var me = this;
    // Merge genes common across selected gene panels
    var geneMap = {};
    // console.log("sqasa" , genePanels[16]._genes)


    var tempGeneArr = [];

    // genePanels.forEach(function(genePanel) {
    //   genePanel._genes.forEach(function(gene, i) {
    //       tempGeneArr.push(gene.geneid)
    //   })
    // })
    // console.log("tempGeneArr len", tempGeneArr.length)
    //
    // genePanels.forEach(function(genePanel) {
    //   genePanel._genes.forEach(function(gene, i) {
    //     gene["searchTerm"] = genePanel.searchTerm;
    //     gene["searchTermArray"] = genePanel.searchTermArray;
    //     gene["searchTermIndex"] = genePanel.searchTermIndex;
    //   })
    // })
    //
    // var genesTempArr = [];
    // genePanels.forEach(function(genePanel) {
    //   genePanel._genes.forEach(function(gene, i) {
    //     genesTempArr.push(gene);
    //   })
    // })
    //
    // console.log("genesTempArr len", genesTempArr[0].searchTermArray)
    // var dupGeneId = [];
    //
    // for(var i=0; i<genesTempArr.length; i++){
    //   for(var j=genesTempArr.length-1; j>i; j--){
    //     if(genesTempArr[i].geneid ===genesTempArr[j].geneid){
    //         // dupGeneId.push(genesTempArr[j].geneid)
    //       // genesTempArr[i].searchTermArray = [...genesTempArr[i].searchTermArray, ...genesTempArr[j].searchTermArray];
    //       // genesTempArr[i].searchTermIndex = [...genesTempArr[i].searchTermIndex, ...genesTempArr[j].searchTermIndex];
    //       // genesTempArr[i].searchTermArray = Array.from(new Set(genesTempArr[i].searchTermArray))
    //       // genesTempArr[i].searchTermIndex = Array.from(new Set(genesTempArr[i].searchTermIndex))
    //     }
    //   }
    // }
    // for(var i=0; i<genesTempArr.length; i++){
    //     if(genesTempArr[i].geneid ==1723){
    //       dupGeneId.push(genesTempArr[i])
    //   }
    // }
    //
    // console.log("dupGeneId" ,dupGeneId)
    //
    //
    // genesTempArr.forEach(function(gene, i) {
    //   var theGene = geneMap[gene.geneid];
    //   if (theGene == null) {
    //     gene._genePanels = {};
    //     gene._conditions = {};
    //     gene._diseases = {};
    //     theGene = gene;
    //     geneMap[gene.geneid] = theGene;
    //   }
    // })


    genePanels.forEach(function(genePanel) {
      // console.log(genePanel)

      genePanel._genes.forEach(function(gene, i) {

        gene["searchTerm"] = genePanel.searchTerm;
        gene["searchTermArray"] = genePanel.searchTermArray;
        gene["searchTermIndex"] = genePanel.searchTermIndex;
        // console.log("gene", gene)
        var theGene = geneMap[gene.geneid];
        if (theGene == null) {
          gene._genePanels = {};
          gene._conditions = {};
          gene._diseases = {};
          theGene = gene;
          geneMap[gene.geneid] = theGene;
        }

        theGene._genePanels[genePanel.id] = genePanel;
        for (var uid in genePanel._diseases) {
          theGene._diseases[uid] = genePanel._diseases[uid];
        }
        genePanel.conditionlist.forEach(function(condition) {
          theGene._conditions[condition.cuid] = condition;
        })

      })
    })
    // console.log("geneMap", geneMap)

    this.mergedGenes = [];
    var b =[];
    for (var key in geneMap) {
      var gene = geneMap[key];
      b.push(key);
      gene._genePanelNames = me.hashToSimpleList(gene._genePanels, "testname", ", ");
      gene._genePanelCount = Object.keys(gene._genePanels).length;

      gene._diseaseNames = me.hashToSimpleList(gene._diseases, "Title", ", ");
      gene._diseaseCount = Object.keys(gene._diseases).length;

      gene._conditionNames = me.hashToSimpleList(gene._conditions, "name", ", ");
      gene._rowNumber      = me.mergedGenes.length+1;

      me.mergedGenes.push(gene);
    }
    // console.log(this.mergedGenes);
    this.mergedGenes.sort(function (a, b) {
      return a.geneid - b.geneid;
    });
    // console.log(this.mergedGenes);
    return this.mergedGenes;

  }

  formatGeneRecs(genes) {
    var me = this;
    const skipFields = {_genePanels: true, _diseases: true, analytetype: true};

    var geneRecs = genes.map(function(gene, idx) {
      var hdr = "";
      if (idx == 0) {
        for (var key in gene) {
          if (!skipFields[key]) {
            if (hdr.length > 0) {
              hdr += "\t";
            }
            hdr += key;
          }
        }
        hdr += "\n";
      }
      var rec = "";
      for (var key in gene) {
        if (!skipFields[key]) {
          if (rec.length > 0) {
            rec += "\t";
          }
          rec += gene[key];
        }
      }

      return hdr + rec;
    })
    .join("\n");
    return geneRecs;
  }


  getGeneBarChartData(genes, width) {

    // Sort genes by gene panel count (descending order)
    // Sort genes by gene panel count (descending order)
    var sortedGenes = genes.sort(function(a,b) {
      if (a._genePanelCount == b._genePanelCount) {
        return b._diseaseCount - a._diseaseCount;
      } else {
        return b._genePanelCount - a._genePanelCount ;
      }
    })
    var multiplicationFactor = (width - 580)/sortedGenes[0]._genePanelCount;
    var svgWidth = (sortedGenes[0]._genePanelCount * multiplicationFactor)+50;
      return sortedGenes.map(function(gene, idx) {
        return {
              key: idx,
              name: gene.name,
              geneid: gene.geneid,
              value: +gene._genePanelCount,
              diseases: gene._diseaseCount,
              conditions: gene._diseaseNames,
              searchTerm: gene.searchTerm,
              searchTermArray: gene.searchTermArray,
              searchTermIndex: gene.searchTermIndex,
              omimSrc: `https://www.ncbi.nlm.nih.gov/omim/?term=${gene.name}`,
              medGenSrc: `https://www.ncbi.nlm.nih.gov/medgen/?term=${gene.name}`,
              geneCardsSrc: `https://www.genecards.org/cgi-bin/carddisp.pl?gene=${gene.name}`,
              ghrSrc: `https://ghr.nlm.nih.gov/gene/${gene.name}`,
              clinGenLink: `https://www.ncbi.nlm.nih.gov/projects/dbvar/clingen/clingen_gene.cgi?sym=${gene.name}`,
//            <stop offset="5%"  stop-color="#36D1DC"/>
//            <stop offset="95%" stop-color="#5B86E5"/>
//            <rect fill="url(#MyGradient)"
              htmlData: `<svg width="${svgWidth}" height="18" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="MyGradient">

                                    <stop offset="5%"  stop-color="#7CA8CF"/>
                                    <stop offset="95%" stop-color="#576E97"/>
                                </linearGradient>
                            </defs>

                            <rect class="genepanelsRect"
                                  x="10" y="1" rx="5" width="${gene._genePanelCount * multiplicationFactor}" height="16"/>
                            <text x="${(gene._genePanelCount * multiplicationFactor)+18}" y="14" font-family="Verdana" font-size="13" fill="#D04F4C">${gene._genePanelCount}</text>
                        </svg>`,

            };
      });

  }


  binarySearchFunction(array, targetValue){
    var min = 0;
    var max = array.length - 1;
    var guess;

    while(min <= max) {
        guess = Math.floor((max + min) / 2);

        if (array[guess] === targetValue) {
            return true;
        }
        else if (array[guess] < targetValue) {
            min = guess + 1;
        }
        else {
            max = guess - 1;
        }

    }

    return false;
  }

  getHaploInsufficiencyScore(gene){
    var genesScr = [
      {
        name: "ACP5",
        score: "sufficient evidence"
      },
      {
        name: "ALX1",
        score: "some evidence"
      },
      {
        name: "AVP",
        score: "some evidence"
      },
      {
        name: "BRAC2",
        score: "sufficient evidence"
      },
      {
        name: "CPT2",
        score: "minimal evidence"
      },
      {
        name: "DHODH",
        score: "some evidence"
      },
      {
        name: "EYA1",
        score: "some evidence"
      },
      {
        name: "POLR1D",
        score: "sufficient evidence"
      },
      {
        name: "SF3B4",
        score: "no evidence"
      },
      {
        name: "TCOF1",
        score: "sufficient evidence"
      }
    ];
    for(var i=0; i<genesScr.length; i++){
      if(gene === genesScr[i].name){
        return genesScr[i].score;
      }
    }
  }

  getClinGenFlag(data){
    var curatedGenes = [
      "ACP5", "ALX1", "AVP", "BRAC2", "CPT2", "DHODH", "EYA1", "POLR1D", "SF3B4", "TCOF1"
    ];
    data.map((x,i)=>{
    if(this.binarySearchFunction(curatedGenes, x.name)){
      x["clinGen"] = {
        val: true
      };
      x["haploScore"]= this.getHaploInsufficiencyScore(x.name);
      x["locationImgSrc"] = `<img src="https://ghr.nlm.nih.gov/gene/${x.name}/location.png">`
    }
    else {
      x["clinGen"] = {
        val: false
      };;
    }
  })

  return data;
  }

  getGeneHistogramData(genes) {

    var histoMap = {};
    genes.forEach(function(gene) {
      var geneCount = histoMap[gene._genePanelCount];
      if (geneCount == null) {
        geneCount = 0;
      }
      geneCount++;
      histoMap[gene._genePanelCount] = parseInt(geneCount);
    })

    var histo = [];
    for (let gpCount in histoMap) {
      let geneCount = histoMap[gpCount];
      histo.push([parseInt(gpCount), geneCount])
    }

    return histo.sort(function(a,b) {
      return b[1] - a[1];
    })
  }

  hashToSimpleList(map, fieldName, delim=" ") {
    var me = this;
    let buf = "";
    for (var key in map) {
      var theObject = map[key];
      if (buf.length > 0) {
        buf += delim;
      }
      buf += theObject[fieldName];
    }
    return buf;
  }


}
