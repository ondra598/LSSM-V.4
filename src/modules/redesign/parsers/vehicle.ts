/* still missing:
    max staff
    water amount
    mileage
*/

interface Groups {
    building: string;
    building_id: string;
    previous_vehicle_id: string;
    next_vehicle_id: string;
    vehicle_name: string;
    user?: string;
    user_state?: 'green' | 'gray';
    user_id?: string;
    fms: string;
    current_mission?: string;
    current_mission_id?: string;
    followup_mission?: string;
    followup_mission_id?: string;
    staff?: string | Record<string, string>;
    own_missions?: string;
    alliance_missions?: string;
}

const REGEX = /(?<building>(?<=<a\s+href="\/buildings\/(?<building_id>\d+)"\s+id="back_to_building">\s*).*?(?=\s*<\/a>))(?:.|\n)*?(?<previous_vehicle_id>(?<=<a\s+href="\/vehicles\/)\d+(?="\s+class="btn\s+btn-xs\s+btn-(?:default|success)">\s*<span\s+class='glyphicon\s+glyphicon-arrow-left'>))(?:.|\n)*?(?<next_vehicle_id>(?<=<a\s+href="\/vehicles\/)\d+(?="\s+class="btn\s+btn-xs\s+btn-(?:default|success)">\s*<span\s+class='glyphicon\s+glyphicon-arrow-right'>))(?:.|\n)*?(?<vehicle_name>(?<=<h1>\s*).*?(?=\s*<\/h1>))(?:.|\n)*?(?:(?<user>(?<=<img\s*.*?src="\/images\/user_(?<user_state>green|gray)\.png"(?:.|\n)*?<a href="\/profile\/(?<user_id>\d+)">\s*).*?(?=\s*<\/a>))(?:.|\n)*?)?(?<fms>(?<=<span\s+title=".*?"\s+class="building_list_fms\s+building_list_fms_)\d+(?=">\s*\d+\s*<\/span>))(?:.|\n)*?(?:(?<current_mission>(?<=<div\s+class="col-xs-6">\s*<a\s+href="\/missions\/(?<current_mission_id>\d+)">\s*).*?(?=\s*<\/a>))(?:.|\n)*?)?(?:(?<followup_mission>(?<=<h3>.*?<\/h3>\s*<ul>\s*<li>\s*<a\s+href="\/missions\/(?<followup_mission_id>\d+)">\s*).*?(?=\s*<\/a>))(?:.|\n)*?)?(?:(?<staff>(?<=<\/h4>(?:.|\n)*?<table(?:.|\n)*?<tbody>\s*)(?:<tr>(?:\s*<td>.*?<\/td>){2}\s*<\/tr>\s*)+(?=\s*<\/tbody>))(?:.|\n)*?)?(?:(?<own_missions>(?<=id="mission_own"(?:.|\n)*?<table(?:.|\n)*?<\/thead>\s*)(?:<tr>(?:\s*<td>(?:.|\n)*?<\/td>){6}\s*<\/tr>\s*)+(?=\s*<\/table>))(?:.|\n)*?)?(?:(?<alliance_missions>(?<=id="mission_alliance"(?:.|\n)*?<table(?:.|\n)*?<\/thead>\s*)(?:<tr>(?:\s*<td>(?:.|\n)*?<\/td>){6}\s*<\/tr>\s*)+(?=\s*<\/table>))(?:.|\n)*?)?<\/html>/;

export default (source: string): void => {
    // TODO: Vehicle image
    const groups = source.match(REGEX)?.groups as Groups | undefined;
    if (!groups) return;
    if (groups.staff && typeof groups.staff === 'string') {
        groups.staff = Object.fromEntries(
            <[string, string][]>groups.staff
                .match(/(?<=<td>).*?(?=<\/td>)/g)
                ?.map((match, index, array) =>
                    index % 2 ? null : [match, array[index + 1]]
                )
                .filter(s => !!s)
        );
    }
    console.log(groups);
};
