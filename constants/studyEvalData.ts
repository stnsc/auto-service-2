// Auto-generated from responses-blind.json — do not edit manually
export interface EvalResponse {
    responseId: number;
    promptId: string;
    promptType: 'simple' | 'complex';
    prompt: string;
    blindLabel: string;
    approxTokens: number;
    response: string;
}

export const EVAL_RESPONSES: EvalResponse[] = [
    {
        responseId: 1,
        promptId: 'S01',
        promptType: 'simple',
        prompt: `What does the oil pressure warning light mean?`,
        blindLabel: 'Model A',
        approxTokens: 97,
        response: `The oil pressure warning light indicates a potential issue with your engine's oil pressure system. Common causes include low oil level, a faulty oil pump, a clogged oil filter, or an oil pressure sensor malfunction. This is a critical warningâ€”continue driving could risk severe engine damage. Did your car make any unusual noises (e.g. knocking) or show other symptoms like low oil level?`,
    },
    {
        responseId: 2,
        promptId: 'S01',
        promptType: 'simple',
        prompt: `What does the oil pressure warning light mean?`,
        blindLabel: 'Model B',
        approxTokens: 51,
        response: `The oil pressure warning light typically indicates that the engine oil pressure is low or the sensor is malfunctioning. This is a serious issue that requires immediate attention to prevent engine damage.`,
    },
    {
        responseId: 3,
        promptId: 'S02',
        promptType: 'simple',
        prompt: `How often should I change my air filter?`,
        blindLabel: 'Model A',
        approxTokens: 512,
        response: `<think>
Okay, so I need to figure out how often someone should change their air filter. Let me start by recalling what I know about air filters. They’re usually found in HVAC systems, right? The filter helps trap dust, pollen, and other airborne particles, which keeps the system running efficiently and maintains indoor air quality.

But how often they need changing depends on a few factors. First, the type of filter. There are different MERV ratings. MERV stands for Minimum Efficiency Reporting Value. A higher MERV means it can capture smaller particles, but it might be a denser filter. That density could mean it needs changing more frequently because it clogs up faster. For example, if you have a higher MERV filter, say 13 or 16, compared to a lower MERV like 8, the higher one might need changing more often. Wait, but some sources might say that higher efficiency filters last longer. Hmm, maybe the opposite is true? Maybe a MERV 8 can be left longer because it's less restrictive? I need to check that.

Then, the environment plays a role. If someone lives in a dusty area or has pets, especially multiple pets, the filter might get dirty faster. Pet dander, fur, and hair can clog the filter quicker. Also, if there are smokers in the household or frequent cooking with high smoke, that would add particles to the air. Similarly, if there's construction nearby where there's a lot of dust, that would contribute.

Household factors like the number of people, pets, and the amount of time the HVAC system runs also matter. If the system is used a lot, say in regions with extreme temperatures where the heating or cooling runs almost constantly, the filter would get dirtier faster. On the other hand, if the system isn't used much, maybe the filter can last longer.

Indoor activities like smoking, using candles, or having fireplaces can add particulates to the air. If someone uses a lot of household products with strong fumes or has an open-plan living space without partitions, dust might circulate more, causing the filter to clog sooner.

So, putting this together, there's a general guideline. I’ve heard people say every 1 to 3 months, but that might vary. For a typical household without pets and a MERV 8 filter, maybe every 90 days. If there are pets, maybe every 60 days. If it's a high-efficiency filter,`,
    },
    {
        responseId: 4,
        promptId: 'S02',
        promptType: 'simple',
        prompt: `How often should I change my air filter?`,
        blindLabel: 'Model B',
        approxTokens: 57,
        response: `The frequency of changing your air filter depends on various factors, but a general rule is to replace it every 15,000 to 30,000 miles. However, some manufacturers recommend checking and replacing it every 12,000 to 18,000 miles.`,
    },
    {
        responseId: 5,
        promptId: 'S03',
        promptType: 'simple',
        prompt: `What is wheel alignment and why does it matter?`,
        blindLabel: 'Model A',
        approxTokens: 113,
        response: `Wheel alignment adjusts the angles of your car's wheels (toe, camber, caster) to match manufacturer specifications. It's crucial because misalignment causes uneven tire wear, reduces fuel efficiency, and can lead to handling issues like pulling to one side. A proper alignment extends tire life, improves safety, and ensures optimal vehicle performance. If you notice pulling, squealing tires, or uneven wear, get an alignment checked by a professional.`,
    },
    {
        responseId: 6,
        promptId: 'S03',
        promptType: 'simple',
        prompt: `What is wheel alignment and why does it matter?`,
        blindLabel: 'Model B',
        approxTokens: 68,
        response: `Wheel alignment, also known as tire alignment, is the process of adjusting the angles of your vehicle's wheels to ensure proper tracking and prevent uneven tire wear. Proper wheel alignment is crucial for maintaining your vehicle's handling, safety, and fuel efficiency.`,
    },
    {
        responseId: 7,
        promptId: 'S04',
        promptType: 'simple',
        prompt: `My battery warning light just came on while driving. What should I do?`,
        blindLabel: 'Model A',
        approxTokens: 87,
        response: `The battery warning light indicates an issue with your vehicle's charging system. Check if the battery terminals are clean and tight while at a safe stop. However, this likely requires a professional inspection to diagnose whether the alternator, battery, or wiring is faulty. Pull over safely and book an appointment ASAP to avoid being stranded.`,
    },
    {
        responseId: 8,
        promptId: 'S04',
        promptType: 'simple',
        prompt: `My battery warning light just came on while driving. What should I do?`,
        blindLabel: 'Model B',
        approxTokens: 59,
        response: `Your vehicle's battery warning light is a serious issue that requires immediate attention to prevent further damage. I recommend you pull over to a safe location as soon as possible and have a professional mechanic investigate the issue.`,
    },
    {
        responseId: 9,
        promptId: 'S05',
        promptType: 'simple',
        prompt: `What does it mean when my car pulls to one side while driving?`,
        blindLabel: 'Model A',
        approxTokens: 72,
        response: `A car pulling to one side while driving is often caused by issues like uneven tire pressure, misalignment, brake problems, or suspension wear. Could you clarify your vehicle's make, model, and year, or mention if there are other symptoms like a dashboard warning light or unusual noises?`,
    },
    {
        responseId: 10,
        promptId: 'S05',
        promptType: 'simple',
        prompt: `What does it mean when my car pulls to one side while driving?`,
        blindLabel: 'Model B',
        approxTokens: 261,
        response: `{
    "response": "Pulling to one side while driving can be caused by various factors, but I'll provide some common likely causes. However, please note that a correct diagnosis requires a closer look, so it's always best to have a professional mechanic inspect your vehicle.",
    "summary": "Vehicle pulls to one side while driving, possible causes include tires, suspension, or steering system issues.",
    "vehicleInfo": {
        "make": null,
        "model": null,
        "year": null,
        "mileage": null,
        "warningLights": null
    },
    "partQuery": null,
    "partPriceLimit": null,
    "intent": "chat",
    "confidence": 0.6
}

To help me narrow down the possible causes, could you please tell me:

- What type of vehicle do you have (make, model, year)?
- At what speed does the car pull to one side? Is it when accelerating, braking, or cruising?
- Do you experience any other symptoms, such as vibrations, uneven tire wear, or loose steering?
- Have you recently changed tires or replaced any steering components?
}`,
    },
    {
        responseId: 11,
        promptId: 'S06',
        promptType: 'simple',
        prompt: `How do I know when my brake pads need replacing?`,
        blindLabel: 'Model B',
        approxTokens: 88,
        response: `Common signs your brake pads need replacing include squeaking/screeching noises when braking, a soft or vibrating brake pedal, or the brake warning light on your dashboard. Brake pads typically last 30,000â€“70,000 miles depending on driving habits. Would you like to share more details like your carâ€™s make/model/year, or any symptoms youâ€™re noticing?`,
    },
    {
        responseId: 12,
        promptId: 'S06',
        promptType: 'simple',
        prompt: `How do I know when my brake pads need replacing?`,
        blindLabel: 'Model A',
        approxTokens: 58,
        response: `Brake pads typically need replacing when they're worn down to 1/8 inch (3-4 mm) or less. You can also look for these signs: spongy brake pedal, loud screeching or grinding noises when braking, and vibration when applying the brakes.`,
    },
    {
        responseId: 13,
        promptId: 'S07',
        promptType: 'simple',
        prompt: `What is engine coolant and how often should I top it up?`,
        blindLabel: 'Model A',
        approxTokens: 193,
        response: `Engine coolant (also called antifreeze) is a mixture of water and ethylene glycol or propylene glycol that regulates engine temperature, prevents freezing in winter, and inhibits corrosion. Most modern vehicles use an orange or green coolant stored in a translucent reservoir marked "MIN" and "MAX." 

Topping-up frequency:
1. Check levels monthly when the engine is off and cool.
2. Top-up only if below the "MIN" line using a 50/50 coolant-water mix.
3. If coolant depletes regularly, check for leaks around the engine, radiator hoses, or the reservoir cap. Never add coolant if the engine is hot!

When to see a mechanic:
- Coolant level drops without obvious leaks
- Engine overheating or warning light appears
- White smoke from tailpipe (potential head gasket issue)`,
    },
    {
        responseId: 14,
        promptId: 'S07',
        promptType: 'simple',
        prompt: `What is engine coolant and how often should I top it up?`,
        blindLabel: 'Model B',
        approxTokens: 91,
        response: `Engine coolant, also known as antifreeze, is a liquid that helps regulate the engine's temperature by preventing it from freezing in cold weather and overheating in hot weather. The recommended top-up frequency depends on the vehicle's make, model, and mileage. Generally, it's advised to check the coolant level every 1,000 to 5,000 miles, and top it up as needed.`,
    },
    {
        responseId: 15,
        promptId: 'S08',
        promptType: 'simple',
        prompt: `My windshield washer fluid warning light is on. Is that serious?`,
        blindLabel: 'Model A',
        approxTokens: 111,
        response: `The windshield washer fluid warning light typically indicates a low fluid level in the reservoir. This is not an immediate safety issue, but itâ€™s important to top off the fluid soon. If the reservoir appears full, there may be a sensor issue or a leak in the system. Check the washer fluid level under the hood (refer to your ownerâ€™s manual for location). If you find a leak or cannot locate the reservoir, book an appointment with a technician.`,
    },
    {
        responseId: 16,
        promptId: 'S08',
        promptType: 'simple',
        prompt: `My windshield washer fluid warning light is on. Is that serious?`,
        blindLabel: 'Model B',
        approxTokens: 59,
        response: `The windshield washer fluid warning light can be a relatively minor issue, but it can also indicate a more serious problem if not addressed. Please check your windshield washer reservoir to ensure it's filled with the recommended fluid.`,
    },
    {
        responseId: 17,
        promptId: 'S09',
        promptType: 'simple',
        prompt: `What causes a car to vibrate at highway speeds?`,
        blindLabel: 'Model A',
        approxTokens: 73,
        response: `Vibration at highway speeds is commonly caused by tire/wheel issues, drive shaft problems, or worn suspension components. Please provide your car's make, model, year, and any additional symptoms (e.g., where you feel the vibration, if it worsens when braking, etc.) to narrow down the cause.`,
    },
    {
        responseId: 18,
        promptId: 'S09',
        promptType: 'simple',
        prompt: `What causes a car to vibrate at highway speeds?`,
        blindLabel: 'Model B',
        approxTokens: 27,
        response: `A vibrating car at highway speeds can be caused by various factors. Let's narrow it down with some questions.`,
    },
    {
        responseId: 19,
        promptId: 'S10',
        promptType: 'simple',
        prompt: `How often should I rotate my tires?`,
        blindLabel: 'Model B',
        approxTokens: 92,
        response: `Tire rotation is generally recommended every 5,000 to 7,500 miles (or 6-12 months, whichever comes first). However, your owner's manual may provide precise recommendations for your vehicle's make/model. If you have an All-Wheel Drive (AWD) vehicle, more frequent rotations (every 3,000-5,000 miles) might be necessary to prevent drivetrain damage from uneven tire wear.`,
    },
    {
        responseId: 20,
        promptId: 'S10',
        promptType: 'simple',
        prompt: `How often should I rotate my tires?`,
        blindLabel: 'Model A',
        approxTokens: 29,
        response: `It's recommended to rotate your tires every 5,000 to 8,000 miles or as recommended by your vehicle's manufacturer.`,
    },
    {
        responseId: 21,
        promptId: 'C01',
        promptType: 'complex',
        prompt: `My car loses power going uphill, I see blue smoke when I start it, and the engine sounds rough at idle. What could be wrong?`,
        blindLabel: 'Model B',
        approxTokens: 132,
        response: `Your car's symptoms suggest potential oil burning issues (blue smoke at startup) combined with power loss and rough idle. Common causes could be worn piston rings, valve seals, or excessive carbon buildup in the combustion chamber. These issues might also be linked to incorrect ignition timing, a faulty mass airflow sensor, or a clogged catalytic converter. Check the oil level regularly to confirm oil consumption, and inspect the exhaust for oil residue. For a proper diagnosis, I recommend booking a professional inspection.`,
    },
    {
        responseId: 22,
        promptId: 'C01',
        promptType: 'complex',
        prompt: `My car loses power going uphill, I see blue smoke when I start it, and the engine sounds rough at idle. What could be wrong?`,
        blindLabel: 'Model A',
        approxTokens: 34,
        response: `These symptoms might indicate a few potential issues with your engine. I'd like to ask a few questions to narrow down the possibilities.`,
    },
    {
        responseId: 23,
        promptId: 'C02',
        promptType: 'complex',
        prompt: `My brakes feel soft and I hear grinding on the front left when I brake hard. Is it safe to drive?`,
        blindLabel: 'Model A',
        approxTokens: 102,
        response: `This is a serious issue that needs immediate inspection. Soft brakes with grinding could mean your front left brake pads are completely worn metal-to-metal, causing the rotor to grind. This severely reduces stopping power and risks complete brake failure. We strongly recommend pulling over to a safe location now and calling for a tow truck to get your vehicle to a repair shop. This is not safe to drive.`,
    },
    {
        responseId: 24,
        promptId: 'C02',
        promptType: 'complex',
        prompt: `My brakes feel soft and I hear grinding on the front left when I brake hard. Is it safe to drive?`,
        blindLabel: 'Model B',
        approxTokens: 49,
        response: `I would strongly advise against driving your vehicle until you can address the brake issue. Grinding noises during braking can be a sign of serious problems, such as worn-out brake pads or rotors.`,
    },
    {
        responseId: 25,
        promptId: 'C03',
        promptType: 'complex',
        prompt: `After a short drive my car starts smelling like burning rubber, the temperature gauge goes into the red, and the AC stopped working. What is happening?`,
        blindLabel: 'Model B',
        approxTokens: 79,
        response: `The burning rubber smell, rising temperature, and AC failure suggest your car's cooling system or belt-driven components may be failing. A worn or broken serpentine belt could cause overheating (due to lack of water pump circulation) and stop the AC compressor. Immediate action is critical to avoid engine damage.`,
    },
    {
        responseId: 26,
        promptId: 'C03',
        promptType: 'complex',
        prompt: `After a short drive my car starts smelling like burning rubber, the temperature gauge goes into the red, and the AC stopped working. What is happening?`,
        blindLabel: 'Model A',
        approxTokens: 41,
        response: `Your symptoms suggest a potential issue with the engine, possibly related to overheating. I'd like to gather more information to provide a more accurate diagnosis.`,
    },
    {
        responseId: 27,
        promptId: 'C04',
        promptType: 'complex',
        prompt: `My 2015 diesel SUV is hard to start in the morning, emits black smoke on acceleration, and fuel consumption has increased noticeably over the past month.`,
        blindLabel: 'Model B',
        approxTokens: 135,
        response: `Your 2015 diesel SUV's hard starting, black smoke under acceleration, and increased fuel consumption likely point to issues with the fuel system (e.g., clogged/leaking injectors), glow plugs, or EGR system. Diesel engines require precise air/fuel balance for proper combustion. These symptoms often worsen with carbon buildup in injectors or improper glow plug function during cold starts. You should book a diagnostic scan for fault codes and have the fuel system inspected professionallyâ€”these repairs typically require specialized tools.`,
    },
    {
        responseId: 28,
        promptId: 'C04',
        promptType: 'complex',
        prompt: `My 2015 diesel SUV is hard to start in the morning, emits black smoke on acceleration, and fuel consumption has increased noticeably over the past month.`,
        blindLabel: 'Model A',
        approxTokens: 34,
        response: `These symptoms suggest a possible issue with your diesel engine. I'd like to gather more information to help you diagnose the problem.`,
    },
    {
        responseId: 29,
        promptId: 'C05',
        promptType: 'complex',
        prompt: `I hear a loud clunking from the front when going over bumps, the steering feels loose, and there is uneven tire wear on the front left. Could these be related?`,
        blindLabel: 'Model B',
        approxTokens: 104,
        response: `These symptoms are likely related. The clunking over bumps, loose steering, and uneven tire wear typically point to worn suspension or steering components like the front left control arm bushings, tie rod ends, or shocks/struts. These parts directly affect handling, alignment, and tire wear. It's important to have a mechanic inspect these components as worn suspension parts can affect safety and vehicle control.`,
    },
    {
        responseId: 30,
        promptId: 'C05',
        promptType: 'complex',
        prompt: `I hear a loud clunking from the front when going over bumps, the steering feels loose, and there is uneven tire wear on the front left. Could these be related?`,
        blindLabel: 'Model A',
        approxTokens: 38,
        response: `The symptoms you've described could be related to a loose or worn-out suspension component, or potentially an alignment issue. Let's investigate further.`,
    },
    {
        responseId: 31,
        promptId: 'C06',
        promptType: 'complex',
        prompt: `My automatic gearbox sometimes refuses to shift from 2nd to 3rd, slips under hard acceleration, and the transmission fluid smells burnt. How urgent is this?`,
        blindLabel: 'Model A',
        approxTokens: 75,
        response: `This is very urgent and requires immediate attention. The burnt smell and slipping indicate serious transmission issues, likely due to overheated or degraded fluid. Continued driving could cause complete transmission failure. Check fluid level and condition right away, and avoid aggressive driving.`,
    },
    {
        responseId: 32,
        promptId: 'C06',
        promptType: 'complex',
        prompt: `My automatic gearbox sometimes refuses to shift from 2nd to 3rd, slips under hard acceleration, and the transmission fluid smells burnt. How urgent is this?`,
        blindLabel: 'Model B',
        approxTokens: 65,
        response: `These symptoms suggest a potential issue with your transmission system. I would recommend seeking immediate professional attention, as burnt transmission fluid and slipping under acceleration can cause further damage to your vehicle's engine or transmission.`,
    },
    {
        responseId: 33,
        promptId: 'C07',
        promptType: 'complex',
        prompt: `The check engine light is on, the car judders when I accelerate, and I noticed the fuel cap was loose last week. Could a loose fuel cap really cause all these symptoms?`,
        blindLabel: 'Model A',
        approxTokens: 119,
        response: `A loose fuel cap can definitely trigger the check engine light due to a 'Evaporative Emission Control System' malfunction code (P0457, P0440). However, engine judder during acceleration typically points to a separate issue like ignition misfire (bad spark plug/coil), fuel injector problem, or transmission shift issues. The fuel cap might explain the light, but your judder requires further diagnosis. Tighten the fuel cap and reset the light to see if the judder persists.`,
    },
    {
        responseId: 34,
        promptId: 'C07',
        promptType: 'complex',
        prompt: `The check engine light is on, the car judders when I accelerate, and I noticed the fuel cap was loose last week. Could a loose fuel cap really cause all these symptoms?`,
        blindLabel: 'Model B',
        approxTokens: 66,
        response: `A loose fuel cap might be able to cause the check engine light to come on, but it's less likely to cause the car to judder when accelerating. I'd like to ask a few more questions to narrow down the possible causes. Can you tell me what make and model your car is?`,
    },
    {
        responseId: 35,
        promptId: 'C08',
        promptType: 'complex',
        prompt: `My car shakes violently only when braking from high speed, the brake pedal pulses under my foot, and stopping distance feels longer than usual.`,
        blindLabel: 'Model A',
        approxTokens: 100,
        response: `The symptoms you described (violent shaking when braking, pulsing pedal, longer stopping distance) most likely indicate warped or glazed brake rotors. This is often caused by excessive heat leading to uneven thickness in the rotors. You should schedule a professional inspection of your braking system as soon as possible to ensure safety. The SHOP page can help you find replacement rotors if needed.`,
    },
    {
        responseId: 36,
        promptId: 'C08',
        promptType: 'complex',
        prompt: `My car shakes violently only when braking from high speed, the brake pedal pulses under my foot, and stopping distance feels longer than usual.`,
        blindLabel: 'Model B',
        approxTokens: 45,
        response: `Based on your description, it's possible that you're experiencing brake system or wheel-related issues. Let's go through some potential causes to help you narrow down the problem.`,
    },
    {
        responseId: 37,
        promptId: 'C09',
        promptType: 'complex',
        prompt: `I hit a pothole two weeks ago and since then the car drifts right, there is a faint humming from the rear, and my tyres look fine visually. What could have been damaged?`,
        blindLabel: 'Model B',
        approxTokens: 95,
        response: `After hitting a pothole, possible damage includes misaligned wheels, bent suspension components, or damaged wheel bearings. The drifting could indicate a wheel alignment issue or a bent strut/rim. The rear humming might point to a damaged wheel bearing, brake rotor, or differential. I recommend checking alignment and inspecting rear suspension components immediately for safety.`,
    },
    {
        responseId: 38,
        promptId: 'C09',
        promptType: 'complex',
        prompt: `I hit a pothole two weeks ago and since then the car drifts right, there is a faint humming from the rear, and my tyres look fine visually. What could have been damaged?`,
        blindLabel: 'Model A',
        approxTokens: 39,
        response: `It's possible that the pothole has damaged the rear suspension or steering components. I'll outline some potential causes and recommend a course of action.`,
    },
    {
        responseId: 39,
        promptId: 'C10',
        promptType: 'complex',
        prompt: `Steam is coming from under the hood, there is a sweet smell inside the cabin, the heater stopped producing warm air, and the engine temperature warning is flashing. What do I do right now?`,
        blindLabel: 'Model B',
        approxTokens: 512,
        response: `<think>
Okay, so the user is experiencing several symptoms with their car: steam coming from under the hood, a sweet smell inside the cabin, the heater isn't working, and the engine temperature warning is flashing. Let me try to break this down step by step.

First, steam from the hood usually indicates a coolant issue. The sweet smell is probably from the coolant leaking, which smells like sweet or like antifreeze. If there's a coolant leak, the engine can overheat because the coolant isn't circulating properly. The heater not producing warm air makes sense because the heater uses the engine's heat, so if there's not enough coolant, the heater won't work. The temperature warning is a clear sign of overheating.

So, the user needs to address overheating. But how? First, they should stop driving immediately if possible because driving with an overheating engine can cause severe damage. If they notice steam, it's dangerous to keep driving without knowing the exact cause. They should find a safe place to pull over.

Next, they shouldn't open the hood right away if the engine is hot because steam can scald. Wait for the engine to cool down. But they need to check the coolant level. If the coolant is low, maybe they can top it up, but if there's a leak, that's a different problem. However, if the radiator cap is faulty, it might not hold pressure, leading to steam.

The presence of coolant in the oil would also be a problem. If they check the oil and it's milky or frothy, that's a sign of a blown head gasket, which is more serious. Because in that case, the coolant is mixing with the oil. Also, exhaust emissions might have a white smoke, but the user said steam from the hood.

Another possibility is the heater core might be leaking, causing the sweet smell inside the cabin. If the heater core is leaking, coolant could be leaking into the cabin, hence the smell. But the other symptoms point more towards engine overheating. So maybe it's a combination of issues.

The user needs to address the immediate danger first. If the temperature light is on, the engine is overheating. So step one is to stop driving. Then check if the coolant reservoir is low and if there's a visible leak. If the coolant isn't low, maybe it's a circulation problem, like a faulty thermostat or a clogged radiator. But the sweet smell suggests a leak, so even if the reservoir isn't low,`,
    },
    {
        responseId: 40,
        promptId: 'C10',
        promptType: 'complex',
        prompt: `Steam is coming from under the hood, there is a sweet smell inside the cabin, the heater stopped producing warm air, and the engine temperature warning is flashing. What do I do right now?`,
        blindLabel: 'Model A',
        approxTokens: 112,
        response: `The symptoms you describe suggest a potential engine or cooling system issue. The sweet smell and steam could indicate overheating, which requires immediate attention. I recommend pulling over to a safe location as soon as possible. From there, let the engine cool down for about 30 minutes before attempting to diagnose the issue further. I advise checking the coolant level and condition, as low levels or dirty coolant can cause these symptoms.`,
    },
];
