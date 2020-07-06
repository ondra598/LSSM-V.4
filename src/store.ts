import Vuex, {
    ActionTree,
    GetterTree,
    ModuleTree,
    MutationTree,
    Store,
    StoreOptions,
} from 'vuex';
import { RootState } from '../typings/store/RootState';
import { VueConstructor } from 'vue/types/vue';
import config from './config';
import {
    ActionStoreParams,
    addStyle,
    Hook,
    ObserveAsyncTab,
    premodifyParams,
} from '../typings/store/Actions';
import { LSSMEvent } from '../typings/helpers';
import storage from './store/storage';
import settings from './store/settings';
import api from './store/api';
import modules from './registerModules';
import { Modules } from '../typings/Module';
import { LSSM } from './core';

export default (Vue: VueConstructor): Store<RootState> => {
    Vue.use(Vuex);

    return new Vuex.Store<RootState>({
        modules: {
            storage,
            settings,
            api,
        } as ModuleTree<RootState>,
        state: {
            prefix: PREFIX,
            version: VERSION,
            mode: MODE,
            lang: BUILD_LANG,
            discord: config.discord,
            games: config.games,
            server: config.server,
            hooks: {},
            mapkit: 'undefined' !== typeof window.mapkit,
            darkmode: document.body.classList.contains('dark'),
            premium: window.user_premium,
            isRegistered: false,
            modules,
            appstore: {
                changes: false,
                reload: false,
            },
            menuItems: [],
            styles: {
                styleSheet: null,
                inserted: false,
            },
            fontAwesome: {
                inserted: false,
            },
        },
        mutations: {
            addHook(state: RootState, event: string) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                state.hooks[event] = window[event];
            },
            setModuleActive(state: RootState, moduleId: keyof Modules) {
                state.modules[moduleId].active = true;
            },
            setAppstoreChanges(state: RootState, changes: boolean) {
                state.appstore.changes = changes;
            },
            setAppstoreReload(state: RootState) {
                state.appstore.reload = true;
            },
            addMenuItem(state: RootState, element: HTMLAnchorElement) {
                state.menuItems.push(element);
            },
            insertStyleSheet(state: RootState) {
                state.styles.styleSheet = document.createElement('style');
                document.head.appendChild(state.styles.styleSheet);
                state.styles.inserted = true;
            },
            useFontAwesome(state: RootState) {
                if (state.fontAwesome.inserted) return;
                const fa = document.createElement('script');
                fa.src =
                    'https://use.fontawesome.com/releases/v5.13.0/js/all.js';
                document.head.appendChild(fa);
                state.fontAwesome.inserted = true;
            },
            setRegisteredState(state: RootState, isRegistered: boolean) {
                state.isRegistered = isRegistered;
            },
        } as MutationTree<RootState>,
        getters: {
            nodeAttribute: (state: RootState) => (attr: string): string =>
                `${state.prefix}-${attr}`,
            wiki: (state: RootState): string =>
                `${config.server}docs/${state.lang}`,
            moduleWiki: (_, getters: GetterTree<RootState, RootState>) => (
                moduleId: keyof Modules
            ): string => `${getters.wiki}/modules/${moduleId}.html`,
            appModules: (state: RootState) =>
                Object.fromEntries(
                    Object.entries(state.modules).filter(
                        module => !module[1].noapp
                    )
                ),
            activeModules: (state: RootState) =>
                Object.keys(state.modules).filter(
                    module => state.modules[module].active
                ),
            modulesSorted(_, getters: GetterTree<RootState, RootState>) {
                return Object.keys(getters.appModules).sort((a, b) => {
                    a = LSSM.$t(`modules.${a}.name`).toString();
                    b = LSSM.$t(`modules.${b}.name`).toString();
                    return a < b ? -1 : a > b ? 1 : 0;
                });
            },
        } as GetterTree<RootState, RootState>,
        actions: {
            hook(
                { state, commit }: ActionStoreParams,
                { post = true, event, callback = () => null }: Hook
            ) {
                if (!state.hooks.hasOwnProperty(event)) {
                    commit('addHook', event);
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    window[event] = (...args: unknown[]) => {
                        document.dispatchEvent(
                            new CustomEvent(`lssm_${event}_before`, {
                                detail: args,
                            })
                        );
                        state.hooks[event](...args);
                        document.dispatchEvent(
                            new CustomEvent(`lssm_${event}_after`, {
                                detail: args,
                            })
                        );
                    };
                }
                document.addEventListener(
                    `lssm_${event}_${post ? 'after' : 'before'}`,
                    event =>
                        callback(...((event as unknown) as LSSMEvent).detail)
                );
            },
            loadModule({ state }: ActionStoreParams, module: keyof Modules) {
                const script = document.createElement('script');
                script.src = `${config.server}${BUILD_LANG}/modules/${module}/main.js?uid=${BUILD_LANG}-${window.user_id}&v=${state.version}`;
                document.body.appendChild(script);
            },
            addMenuItem({ commit }: ActionStoreParams, text: string) {
                const menuItem = document.createElement('a');
                menuItem.href = '#';
                menuItem.innerText = text;
                commit('addMenuItem', menuItem);
                return menuItem;
            },
            addStyles({ dispatch }: ActionStoreParams, styles: addStyle[]) {
                styles.forEach(
                    async style => await dispatch('addStyle', style)
                );
            },
            addStyle(
                { state, commit }: ActionStoreParams,
                { selectorText, style }: addStyle
            ) {
                if (!state.styles.inserted) commit('insertStyleSheet');
                state.styles.styleSheet?.sheet?.addRule(
                    selectorText,
                    Object.entries(style)
                        .map(([rule, value]) => `${rule}: ${value};`)
                        .join(';\n')
                );
            },
            premodifyParams(
                _,
                { event, callback = undefined }: premodifyParams
            ) {
                const originalEvent = window[event];
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                window[event] = (...args) => {
                    callback && callback(...args);
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    originalEvent(...args);
                };
            },
            observeAsyncTab(_, { tabSelector, callback }: ObserveAsyncTab) {
                const tab = document.querySelector(tabSelector);
                if (!tab) return;
                const observer = new MutationObserver(mutations => {
                    mutations.forEach(record => {
                        Array.from(record.addedNodes).find(
                            node => node.nodeName === 'SCRIPT'
                        ) && callback();
                    });
                });
                observer.observe(tab, {
                    childList: true,
                });
            },
        } as ActionTree<RootState, RootState>,
    } as StoreOptions<RootState>);
};