<?php
$viewdefs['base']['layout']['preview'] = array(
    'components' =>
    array(
        array(
            'view' => 'preview-header',
        ),
        array(
            'view' => 'preview',
        ),
        array(
            'layout' => 'preview-activitystream',
            'context' =>
            array(
                'module' => 'Activities',
                'forceNew' => true,
            ),
        ),
    ),
    'type' => 'preview',
    'span' => 12,
);

