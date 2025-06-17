<template class="home-page">
  <h1 class="font-bold text-5xl">Home</h1>

  <div class="flex justify-center upper-part">
    <BiodeskLogo class="logo" />

    <!-- Vertical line -->
    <div class="vl"></div>

    <div class="lab-details">
      <p class="text-5xl text-details">{{ labName }}</p>
      <p class="text-3xl text-details">Admin</p>
    </div>
  </div>

  <div class="box-container">
    <div class="box" @click="goToDashboard" style="cursor: pointer">
      <div>
        <div class="va-icon vuestic-iconset vuestic-iconset-dashboard upper-iconset"></div>
        <p class="font-semibold text-3xl">Dashboard</p>
        <p class="text-box"></p>

        <!-- Triangle -->
        <div class="triangle-corner"></div>
      </div>
    </div>

    <div class="box" @click="goToUsers" style="cursor: pointer">
      <div>
        <div class="va-icon vuestic-iconset vuestic-iconset-user upper-iconset"></div>
        <p class="font-semibold text-3xl">Usuarios</p>
        <p class="text-box"></p>

        <!-- Triangle -->
        <div class="triangle-corner"></div>
      </div>
    </div>

    <div class="box">
      <div>
        <div class="va-icon vuestic-iconset vuestic-iconset-user upper-iconset"></div>
        <p class="font-semibold text-3xl">Datos de Pacientes</p>

        <div class="submenu">
          <div
            class="arrow-hide"
            style="cursor: pointer"
            :class="showOptions ? 'arrow-hide' : 'arrow-show'"
            @click="toggleOptions"
          ></div>

          <transition leave-active-class="slideup-anim" enter-active-class="slidedown-anim">
            <div class="show-options">
              <p class="text-box italic" style="cursor: pointer" v-if="showOptions" @click="toggleOptions">
                Mostrar más...
              </p>
              <p class="text-box italic" style="cursor: pointer" v-if="!showOptions" @click="toggleOptions">
                Mostrar menos...
              </p>
              <p
                class="text-box slideup-anim font-semibold"
                style="cursor: pointer"
                @click="goToPatients"
                v-if="!showOptions"
              >
                - Pacientes
              </p>
              <p
                class="text-box slideup-anim font-semibold"
                style="cursor: pointer"
                @click="goToMedRecords"
                v-if="!showOptions"
              >
                - Historial médico
              </p>
              <p
                class="text-box slideup-anim font-semibold"
                style="cursor: pointer"
                @click="goToTestReq"
                v-if="!showOptions"
              >
                - Solicitud de prueba
              </p>
            </div>
          </transition>
        </div>

        <!-- <div class="submenu">
                    <div class="arrow-hide" style="cursor: pointer" :class="showOptions ? 'arrow-hide' : 'arrow-show'" @click="toggleOptions"></div>
                    <p class="text-box italic flex gap-4" style="cursor: pointer" @click="toggleOptions"> {{ moreToLess }} </p>

                    <div class="space">
                        <transition enter-active-class="slideup-anim" leave-active-class="slidedown-anim">
                            <div v-if="!showOptions" key="options" class="show-options">
                                <p class="text-box font-semibold" style="cursor: pointer" @click="goToPatients"> - Pacientes</p>
                                <p class="text-box font-semibold" style="cursor: pointer" @click="goToMedRecords"> - Historial médico </p>
                                <p class="text-box font-semibold" style="cursor: pointer" @click="goToTestReq"> - Solicitud de prueba </p>
                            </div>
                        </transition>
                    </div>
                </div> -->

        <div class="triangle-corner"></div>
      </div>
    </div>

    <div class="box" @click="goToLaboratory" style="cursor: pointer">
      <div>
        <div class="va-icon vuestic-iconset vuestic-iconset-forms upper-iconset"></div>
        <p class="font-semibold text-3xl">Laboratorio</p>

        <!-- Triangle -->
        <div class="triangle-corner"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BiodeskLogo from '../../components/Biodesk-logo.vue'
import { ref } from 'vue'

const router = useRouter()
const dataLab = localStorage.getItem('lab') || '{}'

const labName = ref(JSON.parse(dataLab).name || '')

const showOptions = ref(true)
const moreToLess = ref('Mostrar más...')

function toggleOptions() {
  showOptions.value = !showOptions.value
}
function changeText() {
  moreToLess.value = 'Mostrar menos'
}

// Navigation shortcuts functions
function goToDashboard() {
  router.push({ name: 'dashboard' })
}
function goToUsers() {
  router.push({ name: 'users' })
}
function goToPatients() {
  router.push({ name: 'patients' })
}
function goToMedRecords() {
  router.push({ name: 'med-history' })
}
function goToTestReq() {
  router.push({ name: 'test-req' })
}
function goToLaboratory() {
  router.push({ name: 'laboratory' })
}
</script>

<style>
.home-page {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 30px;
  gap: 20px;
}

.upper-part {
  height: 9em;
  margin-top: 30px;
  margin-bottom: 100px;
  justify-content: center;
}

.vl {
  margin-left: 30px;
  border-left: 6px solid var(--va-five);
  height: 130px;
}

.lab-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  margin-left: 30px;
  gap: 20px;
}

.text-details {
  color: var(--va-five);
  justify-items: left;
}

.box-container {
  display: flex;
  margin-top: 5px;
  gap: 20px;
  justify-content: center;
}

.box {
  position: relative;
  display: grid;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  width: 280px;
  height: 280px;
  padding: 15px;
  margin: 10px;
  background-color: var(--va-eleven);
  border: 3px solid var(--va-five);
  border-radius: 8px;
  transition: transform 0.2s;
}

.box:hover {
  background-color: var(--va-nineteen);
  transform: scale(1.05);
}

.submenu {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.show-options {
  justify-items: left;
}

.text-box {
  font-size: 1.1rem;
  text-align: center;
}

.text-box.italic {
  color: var(--va-twelve);
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateY(0px);
  }
  to {
    opacity: 0;
    transform: translateY(60px);
  }
}
.slidedown-anim {
  animation: slideDown 2s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(60px);
  }
  to {
    opacity: 1;
    transform: translateY(0px);
  }
}
.slideup-anim {
  animation: slideUp 2s cubic-bezier(0.23, 1, 0.32, 1);
}

.triangle-corner {
  width: 50px;
  aspect-ratio: 1;
  clip-path: polygon(0 100%, 100% 0, 100% 100%);
  background-color: var(--va-five);
  position: absolute;
  bottom: 0;
  right: 0;
}

.arrow-hide {
  height: 25px;
  aspect-ratio: 1/2;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  background-color: var(--va-five);
  transition: transform 0.5s ease;
}

.arrow-show {
  transform: rotate(90deg);
  transition: transform 0.5s ease;
}

.upper-iconset {
  position: absolute;
  top: 10px;
  left: 10px;
  color: var(--va-fifteen);
  font-size: 300%;
}
</style>
