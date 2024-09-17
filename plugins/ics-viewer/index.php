<?php

class ICSViewerPlugin extends \RainLoop\Plugins\AbstractPlugin
{
	const
		NAME = 'ICS Viewer',
		VERSION = '1',
		RELEASE  = '2024-09-17',
		CATEGORY = 'Messages',
		DESCRIPTION = 'Display ICS attachment using ical lib, or JSON-LD details, based on viewICS',
		REQUIRED = '2.34.0';

	public function Init() : void
	{
//		$this->UseLangs(true);
		$this->addJs('message.js');
		$this->addJs('ical.es5.min.cjs');
		$this->addJs('windowsZones.js');
	}
}
