export interface PrilogFData {
    id: number;
    procena_id: number;
    f1_podaci_o_organizaciji: string;
    f1_menadzer_rizika: string;

    f2_podaci_o_posmatranoj_org: string;
    f2_sifra_delatnosti: string;
    f2_odgovorno_lice: string;
    f2_podaci_o_licima: string;

    f3_eksterni_kontekst: {
        pravni_okvir: string;
        ekonomsko_okruzenje: string;
        tehnoloski_razvoj: string;
        drustveno_okruzenje: string;
    };
    f3_interni_kontekst: {
        istorija_stetnih_dogadjaja: string;
        velicina_org_uticaj: string;
        nacin_organizovanja: string;
        nacin_stepen_zastite: string;
        delovanje_zainteresovanih: string;
    };

    f4_identifikacija: string; // Simplified for now, can be complex obj if needed but screenshots look like free text or reference to other headers
    f4_analiza: string;
    f4_vrednovanje: string; // JSONB
    f6_zakljucak: {
        tacka_1: string;
        tacka_2: string;
        tacka_3: string;
        tacka_4: string;
        tacka_5: string;
    };
}

export const F6_ZAKLJUCAK_STAVKE = [
    {
        k: 'tacka_1',
        naslov: '1. Оцена и приказ нивоа и категорије агрегатног ризика посматране организације',
        opisi: [
            'Оценити ниво и категорију агрегатног ризика посматране организације (опис приказан у делу 3.3. Оцена ризика)',
            'Приказати анализу по групама ризика са укупним подацима: ниво, категорија и прихватљивост (опис приказан у делу 3.3. Оцена ризика)',
        ],
    },
    {
        k: 'tacka_2',
        naslov: '2. Закључни приказ нивоа и категорије ризика по огранцима/издвојеним местима',
        opisi: [
            'Оценити ниво и категорију сваког штићеног простора на различитим локацијама, са оквирном инвестицијом за имплементацију мера (опис приказан у делу 3.3. Оцена ризика)',
            'За сваку групу ризика, на основу ризика, приказати мере за поступање са ризицима (опис приказан у делу IV. ОПИС МЕРА И ОБРАЗЛОЖЕЊЕ ЕФЕКТИВНОСТИ)',
        ],
    },
    {
        k: 'tacka_3',
        naslov: '3. Закључни приказ стања заштите',
        opisi: [
            'Приказ постојећег система заштите (опис приказан у делу IV. ОПИС МЕРА И ОБРАЗЛОЖЕЊЕ ЕФЕКТИВНОСТИ)',
            'Управљање обезбеђењем и начин вршења послова обезбеђења у складу са IV. ОПИС МЕРА И ОБРАЗЛОЖЕЊЕ ЕФЕКТИВНОСТИ',
        ],
    },
    {
        k: 'tacka_4',
        naslov: '4. Преглед нових мера заштите',
        opisi: ['У складу са табелом Ф.5 и „Образац SRPS A.L2.003/3“'],
    },
    {
        k: 'tacka_5',
        naslov: '5. Активности које треба да предузима и одржава менаџмент у функцији квалитета обезбеђења',
        opisi: [
            'Имајући у виду идентификоване ризике, ниво ризика, мере за начин за поступање са ризицима, као и резултате анализе цена–корист, предочити менаџменту активности којима ће систем обезбеђења бити ефективно интегрисан у систем корпоративне безбедности и сачинити акциони план за спровођење мера.',
        ],
    },
] as const;

export const INITIAL_PRILOG_F_DATA: PrilogFData = {
    id: 0,
    procena_id: 0,
    f1_podaci_o_organizaciji: '',
    f1_menadzer_rizika: '',
    f2_podaci_o_posmatranoj_org: '',
    f2_sifra_delatnosti: '',
    f2_odgovorno_lice: '',
    f2_podaci_o_licima: '',
    f3_eksterni_kontekst: {
        pravni_okvir: '',
        ekonomsko_okruzenje: '',
        tehnoloski_razvoj: '',
        drustveno_okruzenje: ''
    },
    f3_interni_kontekst: {
        istorija_stetnih_dogadjaja: '',
        velicina_org_uticaj: '',
        nacin_organizovanja: '',
        nacin_stepen_zastite: '',
        delovanje_zainteresovanih: ''
    },
    f4_identifikacija: '',
    f4_analiza: '',
    f4_vrednovanje: '',
    f6_zakljucak: {
        tacka_1: '',
        tacka_2: '',
        tacka_3: '',
        tacka_4: '',
        tacka_5: ''
    }
};
