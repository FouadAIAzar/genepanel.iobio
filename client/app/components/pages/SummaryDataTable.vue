<template>
  <div>
    <v-card-title>
      <v-btn v-on:click="exportGenesCSV"><v-icon>save</v-icon>&nbsp; &nbsp;Export genes as CSV</v-btn>
      <v-spacer></v-spacer>
      <GeneSearchBox
        v-on:search="searchedGeneName($event)">
      </GeneSearchBox>
    </v-card-title>
    <div id="summaryDataTableId">
      <v-data-table
          v-model="selected"
          v-bind:headers="headers"
          v-bind:items="items"
          select-all
          v-bind:pagination.sync="pagination"
          item-key="name"
          v-bind:search="search"
          no-data-text="No Genes Available Currently"
          :custom-filter="filterItemsOnSearch"
          :rows-per-page-items="[5, 10, 25, 50]"
        >
        <template slot="headers" slot-scope="props">
          <tr >
            <th>
              <v-checkbox
                primary
                hide-details
                @click.native="toggleAll"
                :input-value="props.all"
                :indeterminate="props.indeterminate"
              ></v-checkbox>
            </th>
            <th v-for="header in props.headers" :key="header.text"
              :class="['column sortable', pagination.descending ? 'desc' : 'asc', header.value === pagination.sortBy ? 'active' : '', header.visibility, header.class, header.width]"
              v-html="header.text"
            >
              <!-- {{ header.text }} -->
            </th>

          </tr>
        </template>
        <template slot="items" slot-scope="props">
          <tr :active="props.selected" :key="props.item.name">
            <td>
              <v-checkbox
                primary
                hide-details
                v-model="props.selected"
                :input-value="props.selected"
              ></v-checkbox>
            </td>
            <td><v-btn style="cursor: move" icon class="sortHandle"><v-icon>drag_handle</v-icon></v-btn></td>
            <td>{{ props.item.SummaryIndex}}</td>
            <td>
              <span style="font-size:14px; font-weight:600; margin-top:2px; cursor:pointer" @click="showGeneInfo(props.item)" slot="activator">{{ props.item.name }}</span>
              <!-- <span style="font-size:14px; font-weight:600; margin-top:2px" slot="activator">{{ props.item.name }}</span> -->
              <span v-if="props.item.isAssociatedGene===true">
                <v-icon style="font-size:20px" color="blue darken-2">verified_user</v-icon>
              </span>
            </td>
            <td>
              <center>
                <span v-if="props.item.isImportedGenes">
                  <v-icon style="color:#455A64">check_circle_outline</v-icon>
                </span>
              </center>
            </td>
            <td>
              <center>
                <span v-if="props.item.isClinPhen">
                  <v-icon style="color:#455A64">check_circle_outline</v-icon>
                </span>
              </center>
            </td>
            <td>
              <center>
                <span v-for="x in props.item.sourceGTR">
                  <span v-html="x"></span>
                </span>
              </center>
            </td>
            <td>
              <center>
                <span v-for="x in props.item.sourcePheno">
                  <span v-html="x"></span>
                </span>
              </center>
            </td>
            <td>
              <v-menu bottom offset-y style="color:black">
                <v-icon slot="activator" style="padding-right:4px">more_vert</v-icon>
                <v-card>
                  <div class="conditionsBox">
                    <v-list>
                        <v-list-tile>
                          <v-list-tile-content>
                            <v-list-tile-title><strong style="font-size:18px"> Gene Resource Links &nbsp;<i>( {{ props.item.name }} )</i> </strong></v-list-tile-title>
                          </v-list-tile-content>
                          </v-list-tile>
                        <v-divider class="Rightbar_card_divider"></v-divider>
                        <v-list-tile >
                         <v-list-tile-content>
                           <v-list-tile-title><strong>MedGen</strong><a v-bind:href="props.item.medGenSrc" target="_blank"><v-btn small round outline color="primary">Link</v-btn></a></v-list-tile-title>
                           <br>
                           <v-list-tile-sub-title>
                             MedGen organizes information related to human medical genetics, such as attributes of conditions with a genetic contribution.
                          </v-list-tile-sub-title>
                         </v-list-tile-content>
                       </v-list-tile>

                       <br>
                       <v-list-tile >
                        <v-list-tile-content>
                          <v-list-tile-title><strong>OMIM</strong><a v-bind:href="props.item.omimSrc" target="_blank"><v-btn small round outline color="primary">Link</v-btn></a></v-list-tile-title>
                          <br>
                          <v-list-tile-sub-title>
                            OMIM is a comprehensive, authoritative compendium of human genes and genetic phenotypes
                          </v-list-tile-sub-title>
                        </v-list-tile-content>
                      </v-list-tile>

                      <br>
                      <v-list-tile >
                       <v-list-tile-content>
                         <v-list-tile-title><strong>GeneCards</strong><a v-bind:href="props.item.geneCardsSrc" target="_blank"><v-btn small round outline color="primary">Link</v-btn></a></v-list-tile-title>
                         <br>
                         <v-list-tile-sub-title>
                           GeneCards is a searchable, integrative database that provides comprehensive, user-friendly information on all annotated and predicted human genes.
                         </v-list-tile-sub-title>
                       </v-list-tile-content>
                     </v-list-tile>

                     <br>
                     <v-list-tile >
                      <v-list-tile-content>
                        <v-list-tile-title><strong>Genetics Home Reference</strong><a v-bind:href="props.item.ghrSrc" target="_blank"><v-btn small round outline color="primary">Link</v-btn></a></v-list-tile-title>
                        <br>
                        <v-list-tile-sub-title>
                          Genetics Home Reference provides consumer-friendly information about the effects of genetic variation on human health.
                        </v-list-tile-sub-title>
                      </v-list-tile-content>
                    </v-list-tile>

                    <br>
                    <v-list-tile >
                     <v-list-tile-content>
                       <v-list-tile-title><strong>ClinGen</strong><a v-bind:href="props.item.clinGenLink" target="_blank"><v-btn small round outline color="primary">Link</v-btn></a></v-list-tile-title>
                       <br>
                       <v-list-tile-sub-title>
                         The Clinical Genome Resource (ClinGen) consortium curates genes and regions of the genome to assess whether there is evidence to support that these genes/regions are dosage sensitive and should be targeted on a cytogenomic array                       </v-list-tile-sub-title>
                     </v-list-tile-content>
                   </v-list-tile>

                       <br>
                       <v-list-tile >
                        <v-list-tile-content>
                          <v-list-tile-title><strong>Gene ID <i> ( {{props.item.geneId}} )</i> </strong><a v-bind:href="props.item.geneIdLink" target="_blank"><v-btn small round outline color="primary">Link</v-btn></a></v-list-tile-title>
                          <br>
                        </v-list-tile-content>
                      </v-list-tile>
                      <br>
                    </v-list>
                  </div>
                </v-card>

              </v-menu>
            </td>
          </tr>
        </template>
        <template slot="footer">
      </template>
      </v-data-table>
    </div>
    <br>
    <v-dialog v-model="dialog" scrollable max-width="800px">
       <v-card>
         <v-card-title>
           <span class="headline">{{ clickedGene.name }}</span>
         </v-card-title>
         <v-divider></v-divider>
         <v-card-text v-if="ncbiSummary!==null && clickedGene.name === ncbiSummary.name">
          <GeneCard
            :gene="clickedGene.name"
            :ncbiSummary="ncbiSummary"
            :drugs="drugs"
            :geneData="clickedGene"
            >
          </GeneCard>
         </v-card-text>
         <v-divider></v-divider>
         <v-card-actions>
           <v-btn color="blue darken-1" flat @click="dialog = false">Close</v-btn>
         </v-card-actions>
       </v-card>
     </v-dialog>
  </div>
</template>

<script>
import { bus } from '../../routes';
import Sortable from 'sortablejs';
import GeneModel from '../../models/GeneModel';
var geneModel = new GeneModel();
import GeneCard from './GeneCard.vue';
import fetchJsonp from 'fetch-jsonp';
import GeneSearchBox from '../partials/GeneSearchBox.vue';

  export default {
    components: {
      'GeneCard': GeneCard,
      'GeneSearchBox': GeneSearchBox
    },
    props:{
      summaryTableData:{
        type: Array
      },
      geneSearch: {
        type: String
      },
      clinGenesSummary: {
        type: Array
      },
      launchedFromClin: {
        type: Boolean
      },
    },
    data: () => ({
      pagination: {
        sortBy: 'SummaryIndex',
        rowsPerPage: 25 //Sets the number of rows per page
      },
      // itemKeys: new WeakMap(),
      // currentItemKey: 0,
      tmp: '',   //For searching the rows in data table
      search: '',  //For searching the rows in data table
      selected: [],
      selectedTemp: [],
      headers: [
        { text: 'Change order', align: 'left', sortable: false },
        { text: 'Number', align: 'left', sortable: false, value:'SummaryIndex' },
        { text: 'Gene Name', align: 'left', sortable: false, value:'name' },
        { text: 'Added Genes', align: 'left', sortable: false, value: 'isImportedGenes' },
        { text: 'HPO', align: 'left', sortable: false, value: 'isClinPhen' },
        { text: 'GTR', align: 'left', sortable: false, value: 'sourceGTR' },
        { text: 'Phenolyzer', align: 'left', sortable: false, value: ['isPheno', 'sourcePheno', ] },
        { text: '', align: 'left', sortable: false, value: [ 'omimSrc', 'ghrSrc', 'medGenSrc', 'geneCardsSrc', 'clinGenLink', 'isAssociatedGene', 'geneId', 'geneIdLink'] },

      ],
      items: [],
      tableData:[],
      selectedGenesText: "",
      associatedGenesData : [],
      clinGenesSummaryData: [],
      includeClinGenes: 0,
      dialog: false,
      clickedGene: {},
      ncbiSummary: null,
      drugs: [],
    }),
    watch: {
      summaryTableData: function(){
        this.addTableData();
      },
      geneSearch: function(){
        this.search = this.geneSearch;
      },
      clinGenesSummary: function(){
        this.clinGenesSummaryData = this.clinGenesSummary;
      },
    },
    mounted(){
      this.clinGenesSummaryData = this.clinGenesSummary;
      if($('.v-datatable tbody').parents("#summaryDataTableId").length===1){
        $("#summaryDataTableId").find(".v-datatable tbody").attr('id', 'v-datatble-summary');
      }
      bus.$on("selectionFromVennDiagram", (data)=>{
        this.selectGenesFromVennDiagram(data);
      })
      let table = document.querySelector("#v-datatble-summary");
      const _Self = this;
      Sortable.create(table, {
        handle: '.sortHandle',
        onEnd({ newIndex, oldIndex}) {
          const rowSelected = _Self.items.splice(oldIndex, 1)[0];
          _Self.items.splice(newIndex, 0, rowSelected);
          // _Self.selected = _Self.items.splice();
          // _Self.selected = _Self.items;
          // _Self.selected = _Self.selectedTemp;
          var selectedTempArr = [];
          _Self.selectedTemp.map(x=>{
            selectedTempArr.push(x.name);
          })
          _Self.selected = [];

          _Self.items.map(x=>{
            if(selectedTempArr.includes(x.name)){
              _Self.selected.push(x)
            }
          })
        }
      })
      this.addTableData();
      bus.$on("clearClinGenesArray", ()=>{
        // this.clinGenesSummaryData = [];
        this.includeClinGenes++;
      })
      bus.$on("clearClinGenesPhenolyzerArray", ()=>{
        this.includeClinGenes++;
      })
    },
    updated(){
      this.clinGenesSummaryData = this.clinGenesSummary;
      this.selectedTemp = this.selected;
      bus.$on('deSelectAllSummaryGenesBus', (data)=>{
        this.DeSelectAllSummaryGenes(data);
      })

      bus.$on('SelectAllSummaryGenesBus', (data)=>{
        this.SelectAllSummaryGenes(data);
      })

      bus.$on("selectCommonGenesBus", ()=>{
        this.selectCommonGenes();
      })

      bus.$on("SelectedNumberOfSummaryGenes", (data)=>{
        console.log("am i changing?")
        this.selected = this.items.slice(0,data);
      })

      this.$emit("TotalSummaryGenes", this.items.length);
      this.$emit("TotalSummarySelectedGenes", this.selected.length);

      this.selectedGenesText = ""+ this.selected.length + " of " + this.items.length + " genes selected";
      bus.$emit("updateAllGenes", this.selected);
    },
    methods: {
      exportGenesCSV: function(){
        bus.$emit("exportSummaryGenesAsCSV")
      },
      selectGenesFromVennDiagram(data){
        this.selected = [];
        var tempSelectedArray = [];
        if(JSON.stringify(data.sets) === "[0]"){
          this.items.map(x=>{
            if(x.isGtr === data.isGtr){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[1]"){
          this.items.map(x=>{
            if(x.isPheno === data.isPheno ){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[2]"){
          this.items.map(x=>{
            if(x.isImportedGenes === data.isImportedGenes ){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[3]"){
          this.items.map(x=>{
            if(x.isClinPhen === data.isClinPhen ){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[0,1]"){
          this.items.map(x=>{
            if(x.isGtr === data.isGtr && x.isPheno === data.isPheno){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[0,2]"){
          this.items.map(x=>{
            if(x.isGtr === data.isGtr && x.isImportedGenes === data.isImportedGenes){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[0,3]"){
          this.items.map(x=>{
            if(x.isGtr === data.isGtr && x.isClinPhen === data.isClinPhen){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[1,2]"){
          this.items.map(x=>{
            if(x.isImportedGenes === data.isImportedGenes && x.isPheno === data.isPheno){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[1,3]"){
          this.items.map(x=>{
            if(x.isPheno === data.isPheno && x.isClinPhen === data.isClinPhen){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[2,3]"){
          this.items.map(x=>{
            if(x.isImportedGenes === data.isImportedGenes && x.isClinPhen === data.isClinPhen){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[0,2,3]"){
          this.items.map(x=>{
            if(x.isGtr === data.isGtr && x.isImportedGenes === data.isImportedGenes && x.isClinPhen === data.isClinPhen){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[0,1,2]"){
          this.items.map(x=>{
            if(x.isGtr === data.isGtr && x.isImportedGenes === data.isImportedGenes && x.isPheno === data.isPheno){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[0,1,3]"){
          this.items.map(x=>{
            if(x.isGtr === data.isGtr && x.isClinPhen === data.isClinPhen && x.isPheno === data.isPheno){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[1,2,3]"){
          this.items.map(x=>{
            if(x.isImportedGenes === data.isImportedGenes && x.isClinPhen === data.isClinPhen && x.isPheno === data.isPheno){
              this.selected.push(x);
            }
          })
        }
        else if(JSON.stringify(data.sets) === "[0,1,2,3]"){
          this.items.map(x=>{
              if(x.isGtr === data.isGtr && x.isImportedGenes === data.isImportedGenes &&  x.isPheno === data.isPheno && x.isClinPhen === data.isClinPhen){
              this.selected.push(x);
            }
          })
        }

        // this.items.map(x=>{
        //   if(x.isGtr === data.isGtr && x.isImportedGenes === data.isImportedGenes &&  x.isPheno === data.isPheno && x.isClinPhen === data.isClinPhen){
        //     tempSelectedArray.push(x);
        //   }
        // })
        // this.selected = tempSelectedArray;
      },
      addTableData(){
        var xtableData = [];
        this.tableData = this.summaryTableData;
        var associatedGenes = [];
        var nonAssociatedGenes = [];

        this.tableData.map(x=>{
          if(x.isAssociatedGene===true){
            associatedGenes.push(x);
          }
          else{
            nonAssociatedGenes.push(x);
          }
        })
        this.associatedGenesData = associatedGenes;

        if(associatedGenes.length){
          this.items = [...associatedGenes, ...nonAssociatedGenes];
        }
        else {
          this.items = this.tableData;
        }

        this.items.map((x,i)=>{
          x.SummaryIndex = i + 1;
        })

        if(this.launchedFromClin && this.clinGenesSummaryData.length>0 && this.includeClinGenes<3){
          this.selected = [];
          this.items.map(x=>{
            if(this.clinGenesSummaryData.includes(x.name)){
              this.selected.push(x);
            }
          })
          this.selectedTemp = this.selected;
          this.selectedGenesText = ""+ this.selected.length + " of " + this.items.length + " genes selected";
          bus.$emit("updateAllGenes", this.selected);
        }
        else {
          this.selected = this.items.slice();
          this.selectedTemp = this.selected;
          this.selectedGenesText = ""+ this.selected.length + " of " + this.items.length + " genes selected";
          bus.$emit("updateAllGenes", this.selected);
          // console.log("selected summary", this.selected)

        }

      },
      filterItemsOnSearch(items, search, filter) {
        search = search.toString().toLowerCase()
        return items.filter(row => filter(row["name"], search));
      },
      selectCommonGenes(){
        var tempSelected = [];
        for(var i=0; i<this.items.length; i++){
          if(this.items[i].isGtr && this.items[i].isPheno){
            tempSelected.push(this.items[i]);
          }
        }
        this.selected = tempSelected;
      },
      SelectAllSummaryGenes(){
        this.selected = this.items.slice();
      },
      DeSelectAllSummaryGenes(){
        this.selected = [];
      },
      toggleAll () { //Data Table
        if (this.selected.length) this.selected = []
        else this.selected = this.items.slice()
      },
      changeSort (column) { //Data Table
        if (this.pagination.sortBy === column) {
          this.pagination.descending = !this.pagination.descending
        } else {
          this.pagination.sortBy = column
          this.pagination.descending = false
        }
      },
      searchedGeneName: function(gene){
        this.search = gene;
      },
      showGeneInfo(gene){
        this.clickedGene = gene;

        geneModel.promiseGetNCBIGeneSummary(gene.name)
        .then((data)=>{
          this.ncbiSummary = data;
        })

        // fetchJsonp(`http://localhost:4000/gene?name=${gene.name}&fda_approved_drug=false`, {
        //   timeout: 5000,
        //   jsonpCallback:'callback',
        // })
        // .then((response)=>{
        //   return response.json()
        // }).then((json) => {
        //   var arr = [];
        //   json.matchedTerms[0].interactions.map(x=>{
        //     arr.push(x.drugName);
        //   })
        //   this.drugs = arr;
        // }).catch(function(ex) {
        //   console.log('parsing failed', ex)
        // })
        this.dialog = true;
      }
    }
  }
</script>
