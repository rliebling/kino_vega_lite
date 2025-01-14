import * as Vue from "https://cdn.jsdelivr.net/npm/vue@3.2.26/dist/vue.esm-browser.prod.js";

export function init(ctx, payload) {
  ctx.importCSS("main.css");
  ctx.importCSS(
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap"
  );

  const app = Vue.createApp({
    template: `
      <div class="app">
        <!-- Info Messages -->
        <div id="info-box" class="info-box" v-if="missingDep">
          <p>To successfully build charts, you need to add the following dependency:</p>
          <span>{{ missingDep }}</span>
        </div>
        <div id="data-info-box" class="info-box" v-if="noDataVariable">
          <p>To successfully plot graphs, you need at least one dataset available.</p>
          <p>A dataset can be a map of series, for example:</p>
          <span>my_data = %{a: [89, 124, 09, 67, 45], b: [12, 45, 67, 83, 32]}</span>
          <p>Or an <a href="https://github.com/elixir-nx/explorer" target="_blank">Explorer</a> dataframe:</p>
          <span>iris = Explorer.Datasets.iris()</span>
        </div>

        <!-- Chart Form -->
        <form @change="handleFieldChange">
        <div class="container">
          <div class="root">
            <BaseInput
              name="chart_title"
              label="Charting"
              type="text"
              placeholder="Title"
              v-model="rootFields.chart_title"
              class="input--md"
              :disabled="noDataVariable"
            />
            <BaseInput
              name="width"
              label="Width"
              type="number"
              v-model="rootFields.width"
              class="input--xs"
              :disabled="noDataVariable"
            />
            <BaseInput
              name="height"
              label="Height"
              type="number"
              v-model="rootFields.height"
              class="input--xs"
              :disabled="noDataVariable"
            />
          </div>
          <div class="layers">
            <Accordion v-for="(layer, index) in layers" @remove-layer="removeLayer(index)" :hasLayers="hasLayers">
              <template v-slot:title>
                <span>
                  Layer {{ index + 1 }}
                </span>
              </template>
              <template v-slot:subtitle><span>: {{ layer.chart_type }} for {{ layer.data_variable }}</span></template>
              <template v-slot:content>
                <div class="row">
                  <BaseSelect
                    name="data_variable"
                    label="Data"
                    :layer="index"
                    v-model="layer.data_variable"
                    :options="dataVariables"
                    :required
                    :disabled="noDataVariable"
                  />
                  <BaseSelect
                    name="chart_type"
                    label="Chart"
                    :layer="index"
                    v-model="layer.chart_type"
                    :options="chartOptions"
                    :required
                    :disabled="noDataVariable"
                  />
                  <div class="field"></div>
                </div>
                <div class="row">
                  <BaseSelect
                    name="x_field"
                    label="x-axis"
                    :layer="index"
                    v-model="layer.x_field"
                    :options="axisOptions(layer)"
                    :disabled="noDataVariable"
                  />
                  <BaseSelect
                    name="x_field_type"
                    label="Type"
                    :layer="index"
                    v-model="layer.x_field_type"
                    :options="typeOptions"
                    :disabled="!hasDataField(layer.x_field)"
                  />
                  <BaseSelect
                    name="x_field_aggregate"
                    label="Aggregate"
                    :layer="index"
                    v-model="layer.x_field_aggregate"
                    :options="aggregateOptions"
                    :disabled="!hasDataField(layer.x_field)"
                  />
                </div>
                <div class="row">
                  <BaseSelect
                    name="y_field"
                    label="y-axis"
                    :layer="index"
                    v-model="layer.y_field"
                    :options="axisOptions(layer)"
                    :disabled="noDataVariable"
                  />
                  <BaseSelect
                    name="y_field_type"
                    label="Type"
                    :layer="index"
                    v-model="layer.y_field_type"
                    :options="typeOptions"
                    :disabled="!hasDataField(layer.y_field)"
                  />
                  <BaseSelect
                    name="y_field_aggregate"
                    label="Aggregate"
                    :layer="index"
                    v-model="layer.y_field_aggregate"
                    :options="aggregateOptions"
                    :disabled="!hasDataField(layer.y_field)"
                  />
                </div>
                <div class="row">
                  <BaseSelect
                    name="color_field"
                    label="Color"
                    :layer="index"
                    v-model="layer.color_field"
                    :options="axisOptions(layer)"
                    :disabled="noDataVariable"
                  />
                  <BaseSelect
                    name="color_field_type"
                    label="Type"
                    :layer="index"
                    v-model="layer.color_field_type"
                    :options="typeOptions"
                    :disabled="!hasDataField(layer.color_field)"
                  />
                  <BaseSelect
                    name="color_field_aggregate"
                    label="Aggregate"
                    :layer="index"
                    v-model="layer.color_field_aggregate"
                    :options="aggregateOptions"
                    :disabled="!hasDataField(layer.color_field)"
                  />
                </div>
              </template>
            </Accordion>
          </div>
          <div class="add-layer">
            <button class="button button--dashed" type="button" :disabled="noDataVariable" @click="addLayer()">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.41699 4.41602V0.916016H5.58366V4.41602H9.08366V5.58268H5.58366V9.08268H4.41699V5.58268H0.916992V4.41602H4.41699Z"/>
              </svg>
              Add layer
            </button>
          </div>
        </div>
        </form>
      </div>
    `,

    data() {
      return {
        rootFields: payload.root_fields,
        layers: payload.layers,
        dataOptions: payload.data_options,
        missingDep: payload.missing_dep,
        chartOptions: ["point", "bar", "line", "area", "boxplot", "rule"],
        typeOptions: ["quantitative", "nominal", "ordinal", "temporal"],
        aggregateOptions: ["sum", "mean"],
        dataVariables: payload.data_options.map((data) => data["variable"]),
      };
    },

    computed: {
      noDataVariable() {
        return !this.layers[0].data_variable;
      },
      hasLayers() {
        return this.layers.length > 1;
      },
    },

    methods: {
      axisOptions(layer) {
        const dataVariable = layer.data_variable;
        const dataOptions = this.dataOptions.find(
          (data) => data["variable"] === dataVariable
        );
        return dataOptions ? dataOptions.columns.map((column) => column.name).concat("__count__") : [];
      },
      hasDataField(field) {
        return !!field && field !== "__count__";
      },
      isLastLayer(idx) {
        return this.layers.length === idx + 1;
      },
      handleFieldChange(event) {
        const { name, value } = event.target;
        const layer = event.target.getAttribute("layer");
        ctx.pushEvent("update_field", { field: name, value, layer: layer && parseInt(layer) });
      },
      addLayer() {
        ctx.pushEvent("add_layer");
      },
      removeLayer(idx) {
        ctx.pushEvent("remove_layer", { layer: idx });
      },
    },

    components: {
      BaseInput: {
        props: {
          label: {
            type: String,
            default: "",
          },
          modelValue: {
            type: [String, Number],
            default: "",
          },
        },
        template: `
          <div class="root-field">
            <label class="input-label">{{ label }}</label>
            <input
              :value="modelValue"
              @input="$emit('update:modelValue', $event.target.value)"
              v-bind="$attrs"
              class="input"
            >
          </div>
        `,
      },
      BaseSelect: {
        props: {
          label: {
            type: String,
            default: "",
          },
          modelValue: {
            type: [String, Number],
            default: "",
          },
          options: {
            type: Array,
            default: [],
            required: true,
          },
          required: {
            type: Boolean,
            default: false,
          },
        },
        methods: {
          available(value, options) {
            return value ? options.includes(value) : true;
          },
          optionLabel(value) {
            return value === "__count__" ? "COUNT(*)" : value;
          },
        },
        template: `
          <div class="field">
            <label class="input-label">{{ label }}</label>
            <select
              :value="modelValue"
              v-bind="$attrs"
              @change="$emit('update:modelValue', $event.target.value)"
              class="input"
              :class="{ unavailable: !available(modelValue, options) }"
            >
              <option v-if="!required && available(modelValue, options)"></option>
              <option
                v-for="option in options"
                :value="option"
                :key="option"
                :selected="option === modelValue"
              >{{ optionLabel(option) }}</option>
              <option
                v-if="!available(modelValue, options)"
                class="unavailable-option"
                :value="modelValue"
              >{{ optionLabel(modelValue) }}</option>
            </select>
          </div>
        `,
      },
      Accordion: {
        data() {
          return {
            isOpen: payload.layers.length <= 2,
          };
        },
        props: {
          hasLayers: {
            type: Boolean,
            required: true,
          },
        },
        methods: {
          toggleAccordion() {
            this.isOpen = !this.isOpen;
          },
        },
        template: `
          <div class="layer-wrapper" :class="{'wrapper--closed': !isOpen}">
            <div
              class="accordion-control"
              :aria-expanded="isOpen"
              :aria-controls="id"
              v-show="hasLayers || (!isOpen && !hasLayers)"
            >
              <span><slot name="title" /><slot name="subtitle" v-if="!isOpen"/></span>
              <span></span>
              <span>
                <button
                  class="button button--sm"
                  @click="toggleAccordion()"
                  type="button"
                >
                  <svg
                    class="button-svg"
                    :class="{
                      'rotate-180': isOpen,
                      'rotate-0': !isOpen,
                    }"
                    fill="currentColor"
                    stroke="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 10"
                    aria-hidden="true"
                  >
                    <path
                      d="M15 1.2l-7 7-7-7"
                    />
                  </svg>
                </button>
                <button
                  class="button button--sm"
                  v-show=hasLayers
                  @click="$emit('removeLayer')"
                  type="button"
                  v-show="hasLayers"
                >
                  <svg
                    class="button-svg"
                    fill="currentColor"
                    stroke="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      d="M11.75 3.5H15.5V5H14V14.75C14 14.9489 13.921 15.1397 13.7803 15.2803C13.6397 15.421 13.4489
                      15.5 13.25 15.5H2.75C2.55109 15.5 2.36032 15.421 2.21967 15.2803C2.07902 15.1397 2 14.9489 2
                      14.75V5H0.5V3.5H4.25V1.25C4.25 1.05109 4.32902 0.860322 4.46967 0.71967C4.61032 0.579018 4.80109
                      0.5 5 0.5H11C11.1989 0.5 11.3897 0.579018 11.5303 0.71967C11.671 0.860322 11.75 1.05109 11.75
                      1.25V3.5ZM12.5 5H3.5V14H12.5V5ZM5.75 7.25H7.25V11.75H5.75V7.25ZM8.75
                      7.25H10.25V11.75H8.75V7.25ZM5.75 2V3.5H10.25V2H5.75Z"
                    />
                  </svg>
                </button>
              </span>
            </div>
            <div v-show="isOpen">
              <slot name="content" />
            </div>
          </div>
        `,
      },
    },
  }).mount(ctx.root);

  ctx.handleEvent("update_root", ({ fields }) => {
    setRootValues(fields);
  });

  ctx.handleEvent("update_layer", ({ idx, fields }) => {
    setLayerValues(idx, fields);
  });

  ctx.handleEvent("set_layers", ({ layers }) => {
    app.layers = layers;
  });

  ctx.handleEvent("missing_dep", ({ dep }) => {
    app.missingDep = dep;
  });

  ctx.handleEvent("set_available_data", ({ data_options, fields }) => {
    app.dataVariables = data_options.map((data) => data["variable"]);
    app.dataOptions = data_options;
    setLayerValues(0, fields);
  });

  ctx.handleSync(() => {
    // Synchronously invokes change listeners
    document.activeElement &&
      document.activeElement.dispatchEvent(
        new Event("change", { bubbles: true })
      );
  });

  function setRootValues(fields) {
    for (const field in fields) {
      app.rootFields[field] = fields[field];
    }
  }

  function setLayerValues(idx, fields) {
    for (const field in fields) {
      app.layers[idx][field] = fields[field];
    }
  }
}
